import { type CompilationCandidate } from "./context";
import { type FilterAssetMetadata } from "../search/filter";

export class EvidenceRanker {
  rank(
    candidates: CompilationCandidate[],
    assetMetaMap: Record<string, FilterAssetMetadata>
  ): CompilationCandidate[] {
    for (const cand of candidates) {
      const chunk = cand.chunk;
      const assetMeta = assetMetaMap[chunk.asset_id];

      // Starting trustworthiness baseline score
      let trustworthiness = 0.5;

      if (assetMeta) {
        if (assetMeta.lifecycleState === "Published") {
          trustworthiness += 0.2;
        } else if (assetMeta.lifecycleState === "Approved") {
          trustworthiness += 0.1;
        }

        const cat = assetMeta.category;
        if (cat === "Security" || cat === "Emergency" || cat === "Operations") {
          trustworthiness += 0.1;
        }
      }

      // Check completeness length weight
      if (chunk.text.length > 150) {
        trustworthiness += 0.1;
      }

      cand.trustworthinessScore = Math.min(1.0, trustworthiness);
    }

    // Sort descending by trustworthiness score independent of search relevance
    return [...candidates].sort((a, b) => b.trustworthinessScore - a.trustworthinessScore);
  }
}
