import { type ScoreExplanation } from "./context";
import { type RetrievalCandidate } from "./retriever/registry";
import { type FilterAssetMetadata } from "./filter";

export class ScoringEngine {
  explain(
    candidate: RetrievalCandidate,
    finalScore: number,
    assetMeta?: FilterAssetMetadata
  ): ScoreExplanation {
    // Generate explainable sub-score segments
    const hasMatchingTerms = candidate.matchingTerms && candidate.matchingTerms.length > 0;
    const termCount = candidate.matchingTerms ? candidate.matchingTerms.length : 0;
    
    // Keyword: log-boosted matching term frequency
    const keywordScore = hasMatchingTerms ? Math.min(1, Math.log1p(termCount) / Math.log1p(4)) : 0;
    
    // Semantic: directly maps to retrieval similarity weight
    const semanticScore = Math.min(1, Math.max(0, candidate.score));
    
    // Freshness: stable default or metadata time evaluation
    const freshnessScore = 0.5;
    
    // Metadata: boost according to structural heading depth
    const headingVal = candidate.chunk.heading_level || 3;
    const metadataScore = Math.max(0.1, (4 - headingVal) / 3);

    return {
      keywordScore: parseFloat(keywordScore.toFixed(3)),
      semanticScore: parseFloat(semanticScore.toFixed(3)),
      freshnessScore: parseFloat(freshnessScore.toFixed(3)),
      metadataScore: parseFloat(metadataScore.toFixed(3)),
      overallScore: parseFloat(finalScore.toFixed(3)),
    };
  }
}
