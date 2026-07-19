// Search Context, Configs, and Response Types

export type RetrievalStrategy = "keyword" | "semantic" | "hybrid";

export interface SearchFilters {
  readonly category?: string;
  readonly language?: string;
  readonly ownerId?: string;
  readonly assetId?: string;
  readonly lifecycleState?: string;
  readonly tags?: readonly string[];
}

export interface SearchRequest {
  readonly query: string;
  readonly strategy?: RetrievalStrategy;
  readonly filters?: SearchFilters;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ScoreExplanation {
  readonly keywordScore: number;
  readonly semanticScore: number;
  readonly freshnessScore: number;
  readonly metadataScore: number;
  readonly overallScore: number;
}

export interface SearchResult {
  readonly chunkId: string;
  readonly assetId: string;
  readonly versionId: string;
  readonly sectionTitle?: string;
  readonly parentSection?: string;
  readonly text: string; // snippet
  readonly language: string;
  readonly score: ScoreExplanation;
  readonly strategy: RetrievalStrategy;
  readonly matchExplanation: string;
  readonly metadata: {
    readonly page?: number;
    readonly heading?: string;
    readonly source: string;
    readonly parser: string;
    readonly processingVersion: string;
  };
}

export interface ExecutionMetadata {
  readonly durationMs: number;
  readonly strategyUsed: RetrievalStrategy;
  readonly candidateCount: number;
  readonly returnedCount: number;
  readonly cached: boolean;
}

export interface SearchResponse {
  readonly query: string;
  readonly results: readonly SearchResult[];
  readonly metadata: ExecutionMetadata;
}

export interface SearchConfig {
  readonly defaultStrategy: RetrievalStrategy;
  readonly maxCandidates: number;
  readonly minSimilarityScore: number;
  readonly cacheUptimeMs: number;
}

export const defaultSearchConfig: SearchConfig = {
  defaultStrategy: "hybrid",
  maxCandidates: 100,
  minSimilarityScore: 0.05,
  cacheUptimeMs: 300000, // 5 minutes default
};
