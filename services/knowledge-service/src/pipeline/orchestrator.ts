import { type ProcessingContext, type KnowledgeProcessingConfig, defaultPipelineConfig } from "./context";
import { globalParserRegistry } from "./parser/registry";
import { DocumentCleaner } from "./cleaner";
import { DocumentNormalizer } from "./normalizer";
import { LanguageDetector } from "./language";
import { DocumentChunker } from "./chunker";
import { MetadataGenerator } from "./metadata";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("KnowledgeProcessingOrchestrator");

export interface StoragePort {
  getFile(filePath: string): Promise<Buffer>;
}

export interface ProcessingJob {
  readonly id: string;
  readonly assetId: string;
  readonly documentId: string;
  readonly versionId: string;
  status: string;
  retryCount: number;
  errorMessage?: string;
}

export interface DocumentVersion {
  readonly id: string;
  readonly documentId: string;
  readonly name: string;
  readonly mimeType: string;
  readonly filePath: string;
  readonly size: number;
}

export interface JobRepositoryPort {
  updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void>;
}

export interface ProcessedDocRepositoryPort {
  saveProcessedDocument(manifest: any): Promise<void>;
}

export interface ChunkRepositoryPort {
  saveChunks(chunks: any[]): Promise<void>;
}

export class KnowledgeProcessingOrchestrator {
  private readonly cleaner = new DocumentCleaner();
  private readonly normalizer = new DocumentNormalizer();
  private readonly languageDetector = new LanguageDetector();
  private readonly chunker = new DocumentChunker();
  private readonly metadataGenerator = new MetadataGenerator();

  constructor(
    private readonly storageAdapter: StoragePort,
    private readonly jobRepo: JobRepositoryPort,
    private readonly processedDocRepo: ProcessedDocRepositoryPort,
    private readonly chunkRepo: ChunkRepositoryPort,
    private readonly config: KnowledgeProcessingConfig = defaultPipelineConfig
  ) {}

  async orchestrate(job: ProcessingJob, version: DocumentVersion): Promise<void> {
    const startTime = Date.now();
    const warnings: string[] = [];

    const context: ProcessingContext = {
      assetId: job.assetId,
      documentId: job.documentId,
      versionId: job.versionId,
      actorId: "system-orchestrator",
    };

    try {
      // Stage 1: Downloading
      logger.info(`Job ${job.id}: Transitioning status to Downloading`);
      await this.jobRepo.updateJobStatus(job.id, "Downloading");
      
      const fileBuffer = await this.storageAdapter.getFile(version.filePath);
      context.rawBuffer = fileBuffer;

      // Stage 2: Parsing
      logger.info(`Job ${job.id}: Transitioning status to Parsing`);
      await this.jobRepo.updateJobStatus(job.id, "Parsing");

      const parser = globalParserRegistry.getParser(version.mimeType, version.name);
      if (!parser) {
        throw new Error(`Unsupported parser type for MIME: ${version.mimeType}, File: ${version.name}`);
      }

      const rawText = await parser.parse(fileBuffer, context);
      context.rawText = rawText;

      // Stage 3: Cleaning
      logger.info(`Job ${job.id}: Transitioning status to Cleaning`);
      await this.jobRepo.updateJobStatus(job.id, "Cleaning");
      this.cleaner.clean(context);

      // Stage 4: Normalizing
      logger.info(`Job ${job.id}: Transitioning status to Normalizing`);
      await this.jobRepo.updateJobStatus(job.id, "Normalizing");
      this.normalizer.normalize(context);

      // Stage 5: Language Detection & Chunking
      logger.info(`Job ${job.id}: Transitioning status to Chunking`);
      await this.jobRepo.updateJobStatus(job.id, "Chunking");
      this.languageDetector.detect(context);
      
      const chunks = this.chunker.chunk(context, this.config, parser.formatName);
      
      if (chunks.length === 0) {
        warnings.push("Document contained no readable text blocks; generated 0 chunks.");
      }

      // Stage 6: Metadata & Persisting
      logger.info(`Job ${job.id}: Transitioning status to Persisting`);
      await this.jobRepo.updateJobStatus(job.id, "Persisting");

      const durationMs = Date.now() - startTime;
      const manifest = this.metadataGenerator.generateManifest(
        context,
        this.config,
        parser.formatName,
        durationMs,
        warnings
      );

      // Write Manifest & logical chunks to relational tables
      const processedDocId = crypto.randomUUID();
      await this.processedDocRepo.saveProcessedDocument({
        id: processedDocId,
        asset_id: context.assetId,
        document_id: context.documentId,
        version_id: context.versionId,
        parser_used: manifest.parserUsed,
        detected_language: manifest.detectedLanguage,
        chunk_count: manifest.chunkCount,
        character_count: manifest.characterCount,
        word_count: manifest.wordCount,
        checksum_sha256: manifest.checksumSha256,
        processing_version: manifest.processingVersion,
        duration_ms: manifest.durationMs,
        warnings: JSON.stringify(manifest.warnings),
        processed_at: manifest.processedAt,
      });

      if (chunks.length > 0) {
        await this.chunkRepo.saveChunks(
          chunks.map(c => ({
            id: c.id,
            processed_document_id: processedDocId,
            asset_id: context.assetId,
            version_id: context.versionId,
            chunk_index: c.chunkIndex,
            text: c.text,
            section_title: c.sectionTitle || null,
            parent_section: c.parentSection || null,
            heading_level: c.headingLevel || null,
            previous_chunk_id: c.previousChunkId || null,
            next_chunk_id: c.nextChunkId || null,
            language: c.metadata.language,
            word_count: c.wordCount,
            character_count: c.characterCount,
            metadata: JSON.stringify(c.metadata),
          }))
        );
      }

      // Complete successfully
      logger.info(`Job ${job.id}: Transitioning status to Completed`);
      await this.jobRepo.updateJobStatus(job.id, "Completed");

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      logger.error(`Job ${job.id} failed: ${errMsg}`);
      
      try {
        await this.jobRepo.updateJobStatus(job.id, "Failed", errMsg);
      } catch (dbErr: any) {
        logger.error(`Failed to update database status to Failed for job ${job.id}:`, { error: dbErr?.message || String(dbErr) });
      }
      throw err;
    }
  }
}
