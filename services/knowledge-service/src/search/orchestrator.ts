import { type SearchRequest, type SearchResponse, type SearchResult, type RetrievalStrategy, defaultSearchConfig } from "./context";
import { type SearchIndexPort } from "./index-port";
import { QueryAnalyzer } from "./analyzer";
import { RetrieverRegistry } from "./retriever/registry";
import { FilterEngine, type FilterEngineRepoPort, type FilterAssetMetadata } from "./filter";
import { RankingEngine } from "./ranker";
import { ScoringEngine } from "./scorer";
import { SearchCache } from "./cache";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("SearchOrchestrator");

export class KnowledgeSearchOrchestrator {
  private readonly analyzer = new QueryAnalyzer();
  private readonly filterEngine: FilterEngine;
  private readonly rankingEngine = new RankingEngine();
  private readonly scoringEngine = new ScoringEngine();

  constructor(
    private readonly index: SearchIndexPort,
    private readonly retrievers: RetrieverRegistry,
    private readonly repoPort: FilterEngineRepoPort,
    public readonly cache = new SearchCache(defaultSearchConfig.cacheUptimeMs)
  ) {
    this.filterEngine = new FilterEngine(repoPort);
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const strategy: RetrievalStrategy = request.strategy || defaultSearchConfig.defaultStrategy;

    // 1. Query Analysis stage
    const analyzed = this.analyzer.analyze(request.query);
    
    // Combine explicit request filters and inline parsed query filters
    const mergedFilters = {
      ...request.filters,
      ...analyzed.inlineFilters,
      // Union tags list if present in both
      tags: Array.from(new Set([
        ...(request.filters?.tags || []),
        ...(analyzed.inlineFilters.tags || []),
      ])),
    };

    // 2. Cache check lookup
    const cachedResponse = this.cache.get(analyzed.cleanQueryText, strategy, mergedFilters);
    if (cachedResponse) {
      logger.info(`Cache hit for query: "${analyzed.cleanQueryText}" under strategy "${strategy}".`);
      return {
        ...cachedResponse,
        metadata: {
          ...cachedResponse.metadata,
          durationMs: Date.now() - startTime,
          cached: true,
        },
      };
    }

    // 3. Resolve strategy retriever
    const retriever = this.retrievers.getRetriever(strategy);
    if (!retriever) {
      throw new Error(`Unsupported retrieval strategy requested: ${strategy}`);
    }

    // 4. Candidate Retrieval stage
    const maxCandidates = defaultSearchConfig.maxCandidates;
    const candidates = await retriever.retrieve(analyzed, maxCandidates);
    
    // 5. Filtering stage (post-retrieval validation)
    const filteredCandidates = await this.filterEngine.filter(candidates, mergedFilters);

    // 6. Ranking stage
    // Extract metadata map for filtered candidates
    const assetIds = Array.from(new Set(filteredCandidates.map(c => c.chunk.asset_id)));
    const assetMetaMap = assetIds.length > 0 
      ? await this.repoPort.getAssetMetadataList(assetIds) 
      : {};
      
    const rankedCandidates = this.rankingEngine.rank(filteredCandidates, assetMetaMap);

    // 7. Scoring and Result generation
    const limit = request.limit || 10;
    const offset = request.offset || 0;
    const paginated = rankedCandidates.slice(offset, offset + limit);

    const allChunks = this.index.getAllChunks();
    const chunksMap = new Map(allChunks.map(c => [c.id, c]));

    const results: SearchResult[] = paginated.map(item => {
      const c = item.candidate.chunk;
      const assetMeta = assetMetaMap[c.asset_id];
      const explanation = this.scoringEngine.explain(item.candidate, item.finalScore, assetMeta);

      // Parse metadata block
      let parsedMetadata: any = {};
      try {
        parsedMetadata = JSON.parse(c.metadata);
      } catch {}

      return {
        chunkId: c.id,
        assetId: c.asset_id,
        versionId: c.version_id,
        sectionTitle: c.section_title || undefined,
        parentSection: c.parent_section || undefined,
        text: c.text,
        language: c.language,
        score: explanation,
        strategy,
        matchExplanation: `Relevance: ${explanation.semanticScore}, Keywords matched: ${item.candidate.matchingTerms?.join(", ") || "None"}`,
        metadata: {
          page: parsedMetadata.page,
          heading: parsedMetadata.heading,
          source: parsedMetadata.source || "Unknown",
          parser: parsedMetadata.parser || "Unknown",
          processingVersion: parsedMetadata.processingVersion || "Unknown",
        },
      };
    });

    const response: SearchResponse = {
      query: request.query,
      results,
      metadata: {
        durationMs: Date.now() - startTime,
        strategyUsed: strategy,
        candidateCount: filteredCandidates.length,
        returnedCount: results.length,
        cached: false,
      },
    };

    // Store in cache
    this.cache.set(analyzed.cleanQueryText, strategy, response, mergedFilters);

    return response;
  }

  getSuggestions(query: string, limit: number = 5): string[] {
    const analyzed = this.analyzer.analyze(query);
    if (analyzed.tokens.length === 0) return [];

    const suggestions: string[] = [];
    const allChunks = this.index.getAllChunks();

    // Collect matching headings or titles for autocomplete suggestions
    for (const chunk of allChunks) {
      if (chunk.section_title && !suggestions.includes(chunk.section_title)) {
        const titleLower = chunk.section_title.toLowerCase();
        const matchesAll = analyzed.tokens.every(token => titleLower.includes(token));
        if (matchesAll) {
          suggestions.push(chunk.section_title);
          if (suggestions.length >= limit) {
            break;
          }
        }
      }
    }

    return suggestions;
  }
}
