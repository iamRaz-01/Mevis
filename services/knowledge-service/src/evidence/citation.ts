import { type CitationDetails } from "./context";
import { type IndexedChunk } from "../search/index-port";

export class CitationEngine {
  generate(
    chunk: IndexedChunk,
    strategy: string
  ): CitationDetails {
    let docTitle = "Unknown Document";
    let processingVersion = "1.0.0";
    try {
      const parsedMeta = JSON.parse(chunk.metadata);
      docTitle = parsedMeta.source || parsedMeta.heading || docTitle;
      processingVersion = parsedMeta.processingVersion || processingVersion;
    } catch {}

    const formatted = `[Asset: ${chunk.asset_id}, Version: ${chunk.version_id}, Chunk: ${chunk.id}] (Parser: ${strategy})`;

    return {
      assetId: chunk.asset_id,
      versionId: chunk.version_id,
      chunkId: chunk.id,
      sectionTitle: chunk.section_title || undefined,
      documentTitle: docTitle,
      processingVersion,
      retrievalStrategy: strategy,
      formatted,
    };
  }
}
