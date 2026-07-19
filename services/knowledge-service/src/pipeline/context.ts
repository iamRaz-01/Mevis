// Pipeline Processing Context and Configuration Schema

export interface PipelineChunkMetadata {
  readonly page?: number;
  readonly heading?: string;
  readonly source: string;
  readonly parser: string;
  readonly language: string;
  readonly processingVersion: string;
}

export interface PipelineChunk {
  readonly id: string; // chunk_uuid
  readonly chunkIndex: number;
  readonly text: string;
  readonly sectionTitle?: string;
  readonly parentSection?: string;
  readonly headingLevel?: number;
  readonly previousChunkId?: string;
  readonly nextChunkId?: string;
  readonly wordCount: number;
  readonly characterCount: number;
  readonly metadata: PipelineChunkMetadata;
}

export interface PipelineManifest {
  readonly processingVersion: string;
  readonly parserUsed: string;
  readonly detectedLanguage: string;
  readonly chunkCount: number;
  readonly characterCount: number;
  readonly wordCount: number;
  readonly checksumSha256: string;
  readonly durationMs: number;
  readonly warnings: readonly string[];
  readonly processedAt: string;
}

export interface ProcessingContext {
  readonly assetId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly actorId: string;
  
  // Pipeline mutable stage outputs
  rawBuffer?: Buffer;
  rawText?: string;
  cleanedText?: string;
  normalizedText?: string;
  language?: string;
  chunks?: PipelineChunk[];
  manifest?: PipelineManifest;
}

export interface KnowledgeProcessingConfig {
  readonly maxChunkWords: number; // Target word size per chunk (e.g. 200)
  readonly overlapWords: number;  // Overlap words between chunks (e.g. 20)
  readonly minChunkLength: number; // Discard chunks below this length
  readonly defaultLanguage: string; // Fallback language
  readonly pipelineVersion: string; // Software processing version label
}

export const defaultPipelineConfig: KnowledgeProcessingConfig = {
  maxChunkWords: 200,
  overlapWords: 20,
  minChunkLength: 10,
  defaultLanguage: "English",
  pipelineVersion: "1.0.0",
};
