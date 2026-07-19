import { type IndexedChunk } from "../search/index-port";

export interface DuplicateDetails {
  readonly duplicateFlag: boolean;
  readonly details: readonly string[];
}

export class DuplicateDetectionEngine {
  detect(
    currentAssetId: string,
    chunks: readonly IndexedChunk[],
    allChunks: readonly IndexedChunk[]
  ): DuplicateDetails {
    const details: string[] = [];
    
    for (const c of chunks) {
      const clean = c.text.trim().toLowerCase();
      
      // Find matching text contents across different knowledge assets
      const duplicates = allChunks.filter(other => 
        other.asset_id !== currentAssetId && 
        other.text.trim().toLowerCase() === clean
      );

      for (const d of duplicates) {
        details.push(`Chunk "${c.id}" overlaps text with chunk "${d.id}" from asset "${d.asset_id}".`);
      }
    }

    return {
      duplicateFlag: details.length > 0,
      details,
    };
  }
}
