import { type KnowledgeRetriever, type RetrievalCandidate } from "./registry";
import { type SearchIndexPort } from "../index-port";
import { type AnalyzedQuery } from "../analyzer";

export class KeywordRetriever implements KnowledgeRetriever {
  readonly strategy = "keyword";

  constructor(private readonly index: SearchIndexPort) {}

  async retrieve(analyzed: AnalyzedQuery, limit: number): Promise<readonly RetrievalCandidate[]> {
    const tokens = analyzed.tokens;
    if (tokens.length === 0) return [];

    const candidates: RetrievalCandidate[] = [];
    const allChunks = this.index.getAllChunks();

    for (const chunk of allChunks) {
      let score = 0;
      const matchedTerms: string[] = [];
      const chunkTextLower = chunk.text.toLowerCase();
      const titleLower = (chunk.section_title || "").toLowerCase();

      for (const token of tokens) {
        let termMatches = 0;

        // 1. Check title/heading matches (strong boost signal)
        if (titleLower.includes(token)) {
          termMatches += 3; // Section title match boost
        }

        // 2. Check full text matching counts
        let index = chunkTextLower.indexOf(token);
        while (index !== -1) {
          termMatches += 1;
          index = chunkTextLower.indexOf(token, index + token.length);
        }

        // 3. Prefix matching support
        if (termMatches === 0) {
          const words = chunkTextLower.split(/\s+/);
          for (const word of words) {
            if (word.startsWith(token)) {
              termMatches += 0.5;
            }
          }
        }

        if (termMatches > 0) {
          score += termMatches;
          matchedTerms.push(token);
        }
      }

      if (score > 0) {
        candidates.push({
          chunk,
          score,
          matchingTerms: matchedTerms,
        });
      }
    }

    // Sort by lexical relevance and restrict list by limit bounds
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
