import { type CompilationCandidate, type ProvenanceDetails } from "./context";
import { type SearchResult } from "../search/context";
import { type IndexedChunk } from "../search/index-port";
import crypto from "node:crypto";

export class EvidenceCompiler {
  compile(
    searchResults: readonly SearchResult[],
    allChunks: readonly IndexedChunk[]
  ): CompilationCandidate[] {
    const chunksMap = new Map(allChunks.map(c => [c.id, c]));
    const candidates: CompilationCandidate[] = [];

    for (const res of searchResults) {
      let chunk = chunksMap.get(res.chunkId);
      if (!chunk) {
        chunk = {
          id: res.chunkId,
          processed_document_id: res.chunkId + "_doc",
          asset_id: res.assetId,
          version_id: res.versionId,
          chunk_index: 0,
          text: res.text,
          section_title: res.sectionTitle || null,
          parent_section: res.parentSection || null,
          heading_level: null,
          previous_chunk_id: null,
          next_chunk_id: null,
          language: res.language,
          word_count: res.text.split(/\s+/).filter(Boolean).length,
          character_count: res.text.length,
          metadata: JSON.stringify(res.metadata || {}),
        };
      }

      const initialProvenance: ProvenanceDetails = {
        assetId: chunk.asset_id,
        versionId: chunk.version_id,
        documentId: chunk.processed_document_id,
        chunkId: chunk.id,
        sectionTitle: chunk.section_title || undefined,
        parserUsed: res.metadata.parser,
        detectedLanguage: res.language,
      };

      candidates.push({
        id: crypto.randomUUID(),
        chunk,
        searchScore: res.score.overallScore,
        matchingTerms: [], 
        strategy: res.strategy,
        validationStatus: "Valid",
        validationErrors: [],
        trustworthinessScore: 0.5,
        confidenceScore: 0.5,
        confidenceExplanation: "",
        mergedSources: [initialProvenance],
      });
    }

    // Resolve exact text duplicate matches
    const uniqueCandidates: CompilationCandidate[] = [];

    for (const cand of candidates) {
      const cleanText = cand.chunk.text.trim().toLowerCase();
      const existingIndex = uniqueCandidates.findIndex(
        c => c.chunk.text.trim().toLowerCase() === cleanText
      );

      if (existingIndex !== -1) {
        const existing = uniqueCandidates[existingIndex];
        const highestScore = Math.max(existing.searchScore, cand.searchScore);
        const mergedSources = [...existing.mergedSources, ...cand.mergedSources];

        const updated: CompilationCandidate = {
          ...existing,
          searchScore: highestScore,
          mergedSources,
        };
        uniqueCandidates[existingIndex] = updated;
      } else {
        uniqueCandidates.push(cand);
      }
    }

    return uniqueCandidates;
  }
}
