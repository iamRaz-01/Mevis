import { 
  type EvidenceBundle, 
  type EvidenceManifest, 
  type CompilationCandidate,
  type EvidenceContext
} from "./context";
import { EvidenceCompiler } from "./compiler";
import { EvidenceValidator } from "./validator";
import { EvidenceRanker } from "./ranker";
import { ConfidenceEngine } from "./confidence";
import { EvidencePackager } from "./packager";
import { type FilterEngineRepoPort } from "../search/filter";
import { type SearchRequest, type SearchResponse, type SearchResult } from "../search/context";
import { type IndexedChunk } from "../search/index-port";
import { globalEventBus } from "../pipeline/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";
import crypto from "node:crypto";

const logger = new StructuredLogger("EvidenceOrchestrator");

export interface SearchServicePort {
  search(request: SearchRequest): Promise<SearchResponse>;
  getAllChunks(): IndexedChunk[];
}

export interface CompiledBundleRepoPort {
  saveBundle(id: string, query: string, bundle: EvidenceBundle): Promise<void>;
  findBundleById(id: string): Promise<EvidenceBundle | null>;
}

export interface ManifestRepoPort {
  saveManifest(manifest: EvidenceManifest): Promise<void>;
  findManifestById(id: string): Promise<EvidenceManifest | null>;
}

export class EvidenceOrchestrator {
  private readonly compiler = new EvidenceCompiler();
  private readonly validator = new EvidenceValidator();
  private readonly ranker = new EvidenceRanker();
  private readonly confidenceEngine = new ConfidenceEngine();
  private readonly packager = new EvidencePackager();

  constructor(
    private readonly searchService: SearchServicePort,
    private readonly assetRepoPort: FilterEngineRepoPort,
    private readonly bundleRepoPort: CompiledBundleRepoPort,
    private readonly manifestRepoPort: ManifestRepoPort
  ) {}

  async compileFromQuery(request: SearchRequest): Promise<EvidenceBundle> {
    const startTime = Date.now();
    
    // 1. Retrieve candidates from Search Runtime
    const searchResponse = await this.searchService.search(request);
    
    // 2. Call core pipeline compiler
    const bundle = await this.compileFromCandidates(
      request.query, 
      searchResponse.results
    );

    // Track compilation metrics
    const durationMs = Date.now() - startTime;
    metrics.counter("evidence_compilations_total").increment();
    metrics.gauge("evidence_compilation_latency_ms").set(durationMs);

    return bundle;
  }

  async compileFromCandidates(
    query: string, 
    searchResults: readonly SearchResult[]
  ): Promise<EvidenceBundle> {
    const orchestratorTimer = () => {
      const start = Date.now();
      return () => Date.now() - start;
    };
    const durationMsTimer = orchestratorTimer();

    logger.info(`Starting evidence compilation pipeline for query: "${query}" with ${searchResults.length} candidates.`);

    const bundleId = crypto.randomUUID();
    const allChunks = this.searchService.getAllChunks();

    // 1. Compiler stage: map search result coordinates and merge text duplicates
    const candidates = this.compiler.compile(searchResults, allChunks);
    const mergedCount = searchResults.length - candidates.length;
    metrics.counter("evidence_duplicate_merges_total").increment(mergedCount);

    await globalEventBus.publish({
      type: "EvidenceCompiled",
      timestamp: new Date().toISOString(),
      payload: { bundleId, query, candidatesCount: candidates.length, mergedCount },
    });

    // 2. Validator stage: check lifecycles, languages, and formats
    const assetIds = Array.from(new Set(candidates.map(c => c.chunk.asset_id)));
    const assetMetaMap = assetIds.length > 0 
      ? await this.assetRepoPort.getAssetMetadataList(assetIds) 
      : {};

    this.validator.validate(candidates, assetMetaMap);
    
    const validCandidates = candidates.filter(c => c.validationStatus === "Valid");
    const rejectedCandidates = candidates.filter(c => c.validationStatus === "Rejected");

    metrics.counter("evidence_validation_failures_total").increment(rejectedCandidates.length);

    // Publish lifecycle events for audit checks
    for (const valItem of validCandidates) {
      await globalEventBus.publish({
        type: "EvidenceValidated",
        timestamp: new Date().toISOString(),
        payload: { bundleId, chunkId: valItem.chunk.id, assetId: valItem.chunk.asset_id },
      });
    }

    for (const rejItem of rejectedCandidates) {
      await globalEventBus.publish({
        type: "EvidenceRejected",
        timestamp: new Date().toISOString(),
        payload: { bundleId, chunkId: rejItem.chunk.id, errors: rejItem.validationErrors },
      });
    }

    // 3. Ranker stage: grade trustworthiness descending
    const rankedCandidates = this.ranker.rank(validCandidates, assetMetaMap);

    // 4. Confidence Engine stage: compute explainable score properties
    for (const item of rankedCandidates) {
      const assessment = this.confidenceEngine.assess(item);
      item.confidenceScore = assessment.score;
      item.confidenceExplanation = assessment.explanation;
    }

    // 5. Packaging stage: build bundles, linkages maps, and manifests
    const durationMs = durationMsTimer();
    const { bundle, manifest } = this.packager.packageBundle(
      bundleId,
      query,
      rankedCandidates,
      candidates,
      durationMs
    );

    // 6. DB Persistence stage: commit manifest & bundle data
    await this.bundleRepoPort.saveBundle(bundleId, query, bundle);
    await this.manifestRepoPort.saveManifest(manifest);

    // Publish final bundle event
    await globalEventBus.publish({
      type: "EvidenceBundleCreated",
      timestamp: new Date().toISOString(),
      payload: { bundleId, query, itemsCount: bundle.items.length, confidenceAvg: manifest.confidenceAvg },
    });

    metrics.gauge("evidence_average_confidence").set(manifest.confidenceAvg);
    metrics.gauge("evidence_average_bundle_size_bytes").set(JSON.stringify(bundle).length);

    logger.info(`Finished evidence compilation. Saved bundle ${bundleId} and manifest.`);

    return bundle;
  }
}
