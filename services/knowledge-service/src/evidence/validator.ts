import { type CompilationCandidate } from "./context";
import { type FilterAssetMetadata } from "../search/filter";

export class EvidenceValidator {
  validate(
    candidates: CompilationCandidate[],
    assetMetaMap: Record<string, FilterAssetMetadata>
  ): void {
    const validLanguages = new Set(["english", "spanish", "french", "arabic", "hindi"]);

    for (const cand of candidates) {
      const chunk = cand.chunk;
      const assetMeta = assetMetaMap[chunk.asset_id];

      cand.validationErrors = [];

      // 1. Verify asset metadata exists
      if (!assetMeta) {
        cand.validationErrors.push("Missing asset governance metadata registry.");
      } else {
        // 2. Lifecycle validation (must be Approved or Published)
        const state = assetMeta.lifecycleState;
        if (state !== "Approved" && state !== "Published") {
          cand.validationErrors.push(`Asset has non-authoritative state: "${state}".`);
        }
      }

      // 3. Completeness checks
      if (!chunk.text || chunk.text.trim().length === 0) {
        cand.validationErrors.push("Empty chunk text block.");
      }

      // 4. Language compatibility checks
      if (!validLanguages.has(chunk.language.toLowerCase())) {
        cand.validationErrors.push(`Unsupported language encoding: "${chunk.language}".`);
      }

      if (cand.validationErrors.length > 0) {
        cand.validationStatus = "Rejected";
      } else {
        cand.validationStatus = "Valid";
      }
    }
  }
}
