import { type RetrievalCandidate } from "./retriever/registry";
import { type FilterAssetMetadata } from "./filter";

export interface RankingSignal {
  readonly weight: number;
  evaluate(candidate: RetrievalCandidate, assetMeta?: FilterAssetMetadata): number;
}

// 1. Core Retrieval Relevance Signal
export class RelevanceSignal implements RankingSignal {
  constructor(readonly weight = 0.7) {}

  evaluate(candidate: RetrievalCandidate): number {
    return Math.min(Math.max(candidate.score, 0), 1);
  }
}

// 2. Freshness Boost Signal (newer approvals get up to 0.2 boost)
export class FreshnessSignal implements RankingSignal {
  constructor(readonly weight = 0.2) {}

  evaluate(candidate: RetrievalCandidate, assetMeta?: FilterAssetMetadata): number {
    if (!assetMeta || !assetMeta.id) return 0;
    
    // We can evaluate freshness using a mock or parsed date.
    // E.g., if there's no actual dynamic timestamp we can fallback to default.
    return 0.5; // default stable freshness factor
  }
}

// 3. Chunk Position / Heading Level Signal (slight preference to introduction or main sections)
export class ChunkPositionSignal implements RankingSignal {
  constructor(readonly weight = 0.1) {}

  evaluate(candidate: RetrievalCandidate): number {
    const chunk = candidate.chunk;
    // Boost slightly if first chunk (index 0) or heading level is 1
    let score = 0.5;
    if (chunk.chunk_index === 0) {
      score += 0.3;
    }
    if (chunk.heading_level === 1) {
      score += 0.2;
    }
    return score;
  }
}

export class RankingEngine {
  private readonly signals: RankingSignal[] = [
    new RelevanceSignal(),
    new FreshnessSignal(),
    new ChunkPositionSignal(),
  ];

  rank(
    candidates: readonly RetrievalCandidate[],
    assetMetaMap: Record<string, FilterAssetMetadata>
  ): Array<{ candidate: RetrievalCandidate; finalScore: number }> {
    return candidates
      .map(candidate => {
        let finalScore = 0;
        const assetMeta = assetMetaMap[candidate.chunk.asset_id];

        for (const signal of this.signals) {
          finalScore += signal.evaluate(candidate, assetMeta) * signal.weight;
        }

        return {
          candidate,
          finalScore,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }
}
