import * as crypto from "crypto";
import { type ProcessingContext, type PipelineManifest, type KnowledgeProcessingConfig } from "./context";

export class MetadataGenerator {
  generateManifest(
    context: ProcessingContext,
    config: KnowledgeProcessingConfig,
    parserName: string,
    durationMs: number,
    warnings: string[]
  ): PipelineManifest {
    const rawBuffer = context.rawBuffer || Buffer.alloc(0);
    const checksum = crypto.createHash("sha256").update(rawBuffer).digest("hex");

    const text = context.normalizedText || "";
    const characterCount = text.length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const chunkCount = context.chunks?.length || 0;

    const manifest: PipelineManifest = {
      processingVersion: config.pipelineVersion,
      parserUsed: parserName,
      detectedLanguage: context.language || config.defaultLanguage,
      chunkCount,
      characterCount,
      wordCount,
      checksumSha256: checksum,
      durationMs,
      warnings,
      processedAt: new Date().toISOString(),
    };

    context.manifest = manifest;
    return manifest;
  }
}
