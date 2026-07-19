import { type KnowledgeRetriever, type RetrievalCandidate } from "./registry";
import { type SearchIndexPort } from "../index-port";
import { type AnalyzedQuery } from "../analyzer";

export class SemanticRetriever implements KnowledgeRetriever {
  readonly strategy = "semantic";

  constructor(private readonly index: SearchIndexPort) {}

  async retrieve(analyzed: AnalyzedQuery, limit: number): Promise<readonly RetrievalCandidate[]> {
    const tokens = analyzed.tokens;
    if (tokens.length === 0) return [];

    // Call similarity search mapping vector space coordinates
    const similarities = await this.index.searchSimilarity([...tokens], limit);
    const allChunks = this.index.getAllChunks();
    const chunksMap = new Map(allChunks.map(c => [c.id, c]));

    const candidates: RetrievalCandidate[] = [];
    for (const sim of similarities) {
      const chunk = chunksMap.get(sim.chunkId);
      if (chunk) {
        // Collect query tokens present in chunk to populate matchingTerms
        const matched: string[] = [];
        const chunkTextLower = chunk.text.toLowerCase();
        for (const t of tokens) {
          if (chunkTextLower.includes(t)) {
            matched.push(t);
          }
        }

        candidates.push({
          chunk,
          score: sim.similarityScore, // similarity score is [0.0 - 1.0] cosine overlap
          matchingTerms: matched,
        });
      }
    }

    return candidates;
  }
}
