import { type IndexedChunk } from "../search/index-port";

export interface QualityDetails {
  readonly score: number;
  readonly errors: readonly string[];
}

export class QualityEngine {
  assess(
    asset: any,
    chunks: readonly IndexedChunk[]
  ): QualityDetails {
    const errors: string[] = [];
    let score = 0.0;

    // 1. Metadata completeness (max 0.5)
    const metadataFields = ["source", "language", "audience", "confidentiality", "approval_date"];
    let metadataCount = 0;
    for (const field of metadataFields) {
      if (asset[field]) {
        metadataCount++;
      } else {
        errors.push(`Missing governance metadata attribute: "${field}".`);
      }
    }
    score += (metadataCount / metadataFields.length) * 0.5;

    // 2. Structural completeness chunks (max 0.3)
    if (chunks.length > 0) {
      score += 0.3;

      // 3. Linkages pointers checks (max 0.2)
      let linkedCount = 0;
      for (const c of chunks) {
        if (c.previous_chunk_id || c.next_chunk_id || chunks.length === 1) {
          linkedCount++;
        }
      }
      if (linkedCount === chunks.length) {
        score += 0.2;
      } else {
        errors.push("Missing bidirectional pointers on sibling chunks.");
      }
    } else {
      errors.push("Asset chunks list is empty.");
    }

    return {
      score: parseFloat(score.toFixed(3)),
      errors,
    };
  }
}
