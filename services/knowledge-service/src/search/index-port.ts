import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("SearchIndex");

export interface IndexedChunk {
  readonly id: string;
  readonly processed_document_id: string;
  readonly asset_id: string;
  readonly version_id: string;
  readonly chunk_index: number;
  readonly text: string;
  readonly section_title?: string | null;
  readonly parent_section?: string | null;
  readonly heading_level?: number | null;
  readonly previous_chunk_id?: string | null;
  readonly next_chunk_id?: string | null;
  readonly language: string;
  readonly word_count: number;
  readonly character_count: number;
  readonly metadata: string;
}

export interface SearchIndexPort {
  rebuildIndex(chunks: IndexedChunk[]): Promise<void>;
  searchSimilarity(queryTokens: string[], limit: number): Promise<Array<{ chunkId: string; similarityScore: number }>>;
  getAllChunks(): readonly IndexedChunk[];
  getTermWeights(chunkId: string): Map<string, number>;
}

export class InMemoryTfidfSearchIndex implements SearchIndexPort {
  private chunks: IndexedChunk[] = [];
  
  // Maps term -> document frequency (DF)
  private readonly documentFrequencies = new Map<string, number>();
  
  // Maps chunkId -> term -> term frequency (TF)
  private readonly termFrequencies = new Map<string, Map<string, number>>();
  
  // Maps chunkId -> term -> TF-IDF weight
  private readonly tfIdfWeights = new Map<string, Map<string, number>>();
  
  // Maps chunkId -> vector magnitude (for cosine normalization)
  private readonly vectorMagnitudes = new Map<string, number>();

  async rebuildIndex(chunks: IndexedChunk[]): Promise<void> {
    logger.info(`Rebuilding TF-IDF similarity search index over ${chunks.length} chunks.`);
    
    this.chunks = [...chunks];
    this.documentFrequencies.clear();
    this.termFrequencies.clear();
    this.tfIdfWeights.clear();
    this.vectorMagnitudes.clear();

    if (chunks.length === 0) return;

    // 1. Calculate Term Frequencies (TF) and Document Frequencies (DF)
    for (const chunk of chunks) {
      const tokens = this.tokenizeText(chunk.text);
      if (tokens.length === 0) continue;

      const tfMap = new Map<string, number>();
      for (const token of tokens) {
        tfMap.set(token, (tfMap.get(token) || 0) + 1);
      }

      // Convert counts to frequencies
      const tokenFrequencies = new Map<string, number>();
      for (const [token, count] of tfMap.entries()) {
        tokenFrequencies.set(token, count / tokens.length);
        this.documentFrequencies.set(token, (this.documentFrequencies.get(token) || 0) + 1);
      }
      this.termFrequencies.set(chunk.id, tokenFrequencies);
    }

    const numDocs = chunks.length;

    // 2. Compute TF-IDF weights and vector magnitudes
    for (const chunk of chunks) {
      const tfMap = this.termFrequencies.get(chunk.id);
      if (!tfMap) continue;

      const weightsMap = new Map<string, number>();
      let squaredSum = 0;

      for (const [token, tf] of tfMap.entries()) {
        const df = this.documentFrequencies.get(token) || 0;
        // Standard smooth IDF formula
        const idf = Math.log(1 + numDocs / (df + 1));
        const tfIdf = tf * idf;

        weightsMap.set(token, tfIdf);
        squaredSum += tfIdf * tfIdf;
      }

      this.tfIdfWeights.set(chunk.id, weightsMap);
      this.vectorMagnitudes.set(chunk.id, Math.sqrt(squaredSum));
    }
    
    logger.info("TF-IDF similarity index rebuild finished successfully.");
  }

  async searchSimilarity(queryTokens: string[], limit: number): Promise<Array<{ chunkId: string; similarityScore: number }>> {
    if (queryTokens.length === 0 || this.chunks.length === 0) {
      return [];
    }

    // 1. Build Query TF Vector
    const queryCounts = new Map<string, number>();
    for (const token of queryTokens) {
      queryCounts.set(token, (queryCounts.get(token) || 0) + 1);
    }

    // Compute Query TF-IDF weights
    const queryWeights = new Map<string, number>();
    let querySquaredSum = 0;
    const numDocs = this.chunks.length;

    for (const [token, count] of queryCounts.entries()) {
      const tf = count / queryTokens.length;
      const df = this.documentFrequencies.get(token) || 0;
      const idf = Math.log(1 + numDocs / (df + 1));
      const tfIdf = tf * idf;

      queryWeights.set(token, tfIdf);
      querySquaredSum += tfIdf * tfIdf;
    }

    const queryMagnitude = Math.sqrt(querySquaredSum);
    if (queryMagnitude === 0) return [];

    const scores: Array<{ chunkId: string; similarityScore: number }> = [];

    // 2. Compute Cosine Similarity for each document chunk
    for (const chunk of this.chunks) {
      const docWeights = this.tfIdfWeights.get(chunk.id);
      const docMagnitude = this.vectorMagnitudes.get(chunk.id);

      if (!docWeights || !docMagnitude || docMagnitude === 0) continue;

      let dotProduct = 0;
      for (const [token, queryWeight] of queryWeights.entries()) {
        const docWeight = docWeights.get(token) || 0;
        dotProduct += queryWeight * docWeight;
      }

      const cosineSimilarity = dotProduct / (queryMagnitude * docMagnitude);
      if (cosineSimilarity > 0) {
        scores.push({
          chunkId: chunk.id,
          similarityScore: cosineSimilarity,
        });
      }
    }

    // Sort descending and apply limit bounds
    return scores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  getAllChunks(): readonly IndexedChunk[] {
    return this.chunks;
  }

  getTermWeights(chunkId: string): Map<string, number> {
    return this.tfIdfWeights.get(chunkId) || new Map<string, number>();
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  }
}
