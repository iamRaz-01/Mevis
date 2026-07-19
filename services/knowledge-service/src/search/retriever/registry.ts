import { type IndexedChunk } from "../index-port";
import { type AnalyzedQuery } from "../analyzer";

export interface RetrievalCandidate {
  readonly chunk: IndexedChunk;
  readonly score: number; // Raw strategy score
  readonly matchingTerms?: readonly string[];
}

export interface KnowledgeRetriever {
  readonly strategy: string;
  retrieve(analyzed: AnalyzedQuery, limit: number): Promise<readonly RetrievalCandidate[]>;
}

export class RetrieverRegistry {
  private readonly retrievers = new Map<string, KnowledgeRetriever>();

  register(retriever: KnowledgeRetriever): void {
    this.retrievers.set(retriever.strategy.toLowerCase(), retriever);
  }

  getRetriever(strategy: string): KnowledgeRetriever | null {
    return this.retrievers.get(strategy.toLowerCase()) || null;
  }
}

export const globalRetrieverRegistry = new RetrieverRegistry();
