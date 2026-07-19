import { 
  type EvidenceBundle, 
  type EvidenceItem, 
  type EvidenceLink, 
  type CitationDetails, 
  type CompilationCandidate,
  type EvidenceManifest
} from "./context";
import { CitationEngine } from "./citation";
import crypto from "node:crypto";

export class EvidencePackager {
  private readonly citationEngine = new CitationEngine();

  packageBundle(
    bundleId: string,
    query: string,
    rankedCandidates: readonly CompilationCandidate[],
    allCandidates: readonly CompilationCandidate[],
    durationMs: number
  ): { bundle: EvidenceBundle; manifest: EvidenceManifest } {
    // Only valid candidates are packaged as active evidence items
    const validCandidates = rankedCandidates.filter(c => c.validationStatus === "Valid");
    const rejectedCandidates = allCandidates.filter(c => c.validationStatus === "Rejected");

    const citationsMap: Record<string, CitationDetails> = {};
    const items: EvidenceItem[] = [];
    let rankingCounter = 1;

    for (const cand of validCandidates) {
      const chunk = cand.chunk;
      const citation = this.citationEngine.generate(chunk, cand.strategy);
      
      const citationId = crypto.createHash("sha256").update(citation.formatted).digest("hex").slice(0, 12);
      citationsMap[citationId] = citation;

      items.push({
        id: cand.id,
        chunkId: chunk.id,
        assetId: chunk.asset_id,
        versionId: chunk.version_id,
        sectionTitle: chunk.section_title || undefined,
        excerpt: chunk.text,
        confidence: cand.confidenceScore,
        citationId,
        validationStatus: "Valid",
        ranking: rankingCounter++,
        provenance: cand.mergedSources,
      });
    }

    // 1. Build Relationship Links for the Evidence Graph
    const links: EvidenceLink[] = [];
    const validChunkIds = new Set(items.map(it => it.chunkId));
    const itemsByChunkId = new Map(items.map(it => [it.chunkId, it]));

    for (const it of items) {
      const chunk = allCandidates.find(c => c.chunk.id === it.chunkId)?.chunk;
      if (!chunk) continue;

      // Link to previous chunk sibling if it exists in our evidence items
      if (chunk.previous_chunk_id && validChunkIds.has(chunk.previous_chunk_id)) {
        const prevItem = itemsByChunkId.get(chunk.previous_chunk_id);
        if (prevItem) {
          links.push({
            source: it.id,
            target: prevItem.id,
            relation: "previous_chunk",
          });
        }
      }

      // Link to next chunk sibling if it exists in our evidence items
      if (chunk.next_chunk_id && validChunkIds.has(chunk.next_chunk_id)) {
        const nextItem = itemsByChunkId.get(chunk.next_chunk_id);
        if (nextItem) {
          links.push({
            source: it.id,
            target: nextItem.id,
            relation: "next_chunk",
          });
        }
      }

      // Link to other chunks sharing the same parent section
      if (chunk.parent_section) {
        for (const other of items) {
          if (other.id === it.id) continue;
          const otherChunk = allCandidates.find(c => c.chunk.id === other.chunkId)?.chunk;
          if (otherChunk && otherChunk.parent_section === chunk.parent_section) {
            links.push({
              source: it.id,
              target: other.id,
              relation: "parent_section",
            });
          }
        }
      }
    }

    // Deduplicate graph links to keep relationships clean
    const uniqueLinks: EvidenceLink[] = [];
    const linkKeys = new Set<string>();
    for (const l of links) {
      const key = `${l.source}:${l.target}:${l.relation}`;
      const revKey = `${l.target}:${l.source}:${l.relation}`;
      if (!linkKeys.has(key) && !linkKeys.has(revKey)) {
        uniqueLinks.push(l);
        linkKeys.add(key);
      }
    }

    // 2. Compute statistics
    const totalWordCount = items.reduce((sum, it) => {
      const words = it.excerpt.split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);

    const confidenceSum = items.reduce((sum, it) => sum + it.confidence, 0);
    const confidenceAvg = items.length > 0 ? (confidenceSum / items.length) : 1.0;

    // 3. Assemble complete bundle struct
    const bundle: EvidenceBundle = {
      id: bundleId,
      query,
      items,
      citations: citationsMap,
      confidence: {
        overallConfidence: parseFloat(confidenceAvg.toFixed(3)),
        explanation: `Average compiled confidence score across ${items.length} validated facts.`,
      },
      statistics: {
        itemsCount: items.length,
        totalWordCount,
        rejectedCount: rejectedCandidates.length,
      },
      graph: {
        nodes: items,
        links: uniqueLinks,
      },
      executionMetadata: {
        durationMs,
        sourceSearchCandidates: allCandidates.length,
      },
    };

    // 4. Assemble Audit Manifest
    // Count merged candidate duplicates: original search candidates minus unique candidates
    const mergedCount = allCandidates.reduce((sum, c) => sum + (c.mergedSources.length - 1), 0);

    const manifest: EvidenceManifest = {
      id: bundleId,
      query,
      executionTimeMs: durationMs,
      retrievedCount: allCandidates.length + mergedCount,
      validatedCount: validCandidates.length,
      rejectedCount: rejectedCandidates.length,
      mergedCount,
      evidenceCount: items.length,
      confidenceAvg: parseFloat(confidenceAvg.toFixed(3)),
      createdAt: new Date().toISOString(),
    };

    return {
      bundle,
      manifest,
    };
  }
}
