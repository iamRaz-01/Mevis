import { type KnowledgeRetriever, type RetrievalCandidate } from "./registry";
import { type AnalyzedQuery } from "../analyzer";

export class HybridRetriever implements KnowledgeRetriever {
  readonly strategy = "hybrid";

  constructor(
    private readonly keywordRetriever: KnowledgeRetriever,
    private readonly semanticRetriever: KnowledgeRetriever
  ) {}

  async retrieve(analyzed: AnalyzedQuery, limit: number): Promise<readonly RetrievalCandidate[]> {
    // 1. Fetch from keyword & semantic retrievers independently
    const [keywordList, semanticList] = await Promise.all([
      this.keywordRetriever.retrieve(analyzed, limit * 2),
      this.semanticRetriever.retrieve(analyzed, limit * 2),
    ]);

    if (keywordList.length === 0 && semanticList.length === 0) {
      return [];
    }

    // Find max scores for normalization
    const maxKeyword = keywordList.length > 0 ? Math.max(...keywordList.map(c => c.score)) : 1;
    const maxSemantic = semanticList.length > 0 ? Math.max(...semanticList.map(c => c.score)) : 1;

    // Maps chunkId -> candidate details
    const mergedCandidates = new Map<string, {
      candidate: RetrievalCandidate;
      keywordScore: number;
      semanticScore: number;
    }>();

    // 2. Add keyword hits
    for (const item of keywordList) {
      mergedCandidates.set(item.chunk.id, {
        candidate: item,
        keywordScore: item.score,
        semanticScore: 0,
      });
    }

    // 3. Add/Update semantic hits
    for (const item of semanticList) {
      const existing = mergedCandidates.get(item.chunk.id);
      if (existing) {
        mergedCandidates.set(item.chunk.id, {
          candidate: {
            ...existing.candidate,
            // Union matching terms from both retrievers
            matchingTerms: Array.from(new Set([
              ...(existing.candidate.matchingTerms || []),
              ...(item.matchingTerms || []),
            ])),
          },
          keywordScore: existing.keywordScore,
          semanticScore: item.score,
        });
      } else {
        mergedCandidates.set(item.chunk.id, {
          candidate: item,
          keywordScore: 0,
          semanticScore: item.score,
        });
      }
    }

    // 4. Calculate normalized combined scores
    const results: RetrievalCandidate[] = [];
    for (const entry of mergedCandidates.values()) {
      const normK = maxKeyword > 0 ? (entry.keywordScore / maxKeyword) : 0;
      const normS = maxSemantic > 0 ? (entry.semanticScore / maxSemantic) : 0;

      // Linear combination weight factors (50/50 blend)
      const combinedScore = (normK * 0.5) + (normS * 0.5);

      results.push({
        chunk: entry.candidate.chunk,
        score: combinedScore,
        matchingTerms: entry.candidate.matchingTerms,
      });
    }

    // Sort descending and apply limit bounds
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
