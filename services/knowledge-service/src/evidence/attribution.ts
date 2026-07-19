import { type ProvenanceDetails } from "./context";
import { type IndexedChunk } from "../search/index-port";
import { type SearchResult } from "../search/context";

export class SourceAttribution {
  buildProvenance(chunk: IndexedChunk, searchResult: SearchResult): ProvenanceDetails {
    return {
      assetId: chunk.asset_id,
      versionId: chunk.version_id,
      documentId: chunk.processed_document_id,
      chunkId: chunk.id,
      sectionTitle: chunk.section_title || undefined,
      parserUsed: searchResult.metadata.parser,
      detectedLanguage: searchResult.language,
    };
  }

  explainProvenance(prov: ProvenanceDetails): string {
    return `Asset: ${prov.assetId} (v${prov.versionId}) -> Doc: ${prov.documentId} -> Chunk: ${prov.chunkId} (${prov.parserUsed}, ${prov.detectedLanguage})`;
  }
}
