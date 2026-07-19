import * as crypto from "crypto";
import { type ProcessingContext, type PipelineChunk, type KnowledgeProcessingConfig } from "./context";

export class DocumentChunker {
  chunk(context: ProcessingContext, config: KnowledgeProcessingConfig, parserName: string): PipelineChunk[] {
    const text = context.normalizedText || "";
    if (!text) {
      context.chunks = [];
      return [];
    }

    const paragraphs = text.split("\n\n");
    const chunks: PipelineChunk[] = [];
    
    let currentChunkWords: string[] = [];
    let currentChunkIndex = 0;
    
    // Tracking active heading hierarchies
    let activeHeading = "";
    let activeHeadingLevel = 0;
    let headingStack: { title: string; level: number }[] = [];

    const getParentSection = (level: number): string | undefined => {
      // Find the first heading in stack with a level strictly less than current level
      for (let i = headingStack.length - 1; i >= 0; i--) {
        if (headingStack[i].level < level) {
          return headingStack[i].title;
        }
      }
      return undefined;
    };

    const flushChunk = () => {
      if (currentChunkWords.length === 0) return;

      const chunkText = currentChunkWords.join(" ");
      const chunkId = crypto.randomUUID();
      
      const parentSection = activeHeadingLevel > 1 ? getParentSection(activeHeadingLevel) : undefined;

      chunks.push({
        id: chunkId,
        chunkIndex: currentChunkIndex++,
        text: chunkText,
        sectionTitle: activeHeading || undefined,
        parentSection,
        headingLevel: activeHeadingLevel || undefined,
        wordCount: currentChunkWords.length,
        characterCount: chunkText.length,
        metadata: {
          heading: activeHeading || undefined,
          source: context.documentId,
          parser: parserName,
          language: context.language || config.defaultLanguage,
          processingVersion: config.pipelineVersion,
        },
      });

      currentChunkWords = [];
    };

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      // Detect markdown-style header lines: e.g. "## Section Title"
      if (trimmed.startsWith("#")) {
        // First flush any accumulated text from previous sections
        flushChunk();

        const match = /^(#+)\s+(.+)$/.exec(trimmed);
        if (match) {
          activeHeadingLevel = match[1].length;
          activeHeading = match[2].trim();

          // Maintain heading hierarchical stack
          headingStack = headingStack.filter(h => h.level < activeHeadingLevel);
          headingStack.push({ title: activeHeading, level: activeHeadingLevel });
          continue; // Header lines don't get chunked as body text
        }
      }

      // Split paragraph into words
      const words = trimmed.split(/\s+/).filter(Boolean);
      
      // If adding this paragraph exceeds limit, flush first
      if (currentChunkWords.length + words.length > config.maxChunkWords && currentChunkWords.length > 0) {
        flushChunk();
      }

      // If the paragraph itself is larger than chunk budget, split it by sentence structures
      if (words.length > config.maxChunkWords) {
        const sentences = trimmed.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          const sentenceWords = sentence.split(/\s+/).filter(Boolean);
          if (currentChunkWords.length + sentenceWords.length > config.maxChunkWords && currentChunkWords.length > 0) {
            flushChunk();
          }
          currentChunkWords.push(...sentenceWords);
        }
      } else {
        currentChunkWords.push(...words);
      }
    }

    // Flush any remaining trailing content
    flushChunk();

    // Establish bidirectional linked-list structure across resulting chunks
    for (let i = 0; i < chunks.length; i++) {
      const prev = chunks[i - 1];
      const next = chunks[i + 1];

      // Mutate chunk linkage ids
      Object.assign(chunks[i], {
        previousChunkId: prev ? prev.id : undefined,
        nextChunkId: next ? next.id : undefined,
      });
    }

    context.chunks = chunks;
    return chunks;
  }
}
