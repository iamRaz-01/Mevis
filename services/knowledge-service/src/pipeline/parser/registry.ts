import { type ProcessingContext } from "../context";
import { TxtParser } from "./txt";
import { MarkdownParser } from "./md";
import { PdfParser } from "./pdf";
import { DocxParser } from "./docx";

export interface DocumentParser {
  readonly formatName: string;
  readonly mimeTypes: readonly string[];
  readonly fileExtensions: readonly string[];
  
  parse(buffer: Buffer, context: ProcessingContext): Promise<string>;
}

export class ParserRegistry {
  private readonly parsers = new Map<string, DocumentParser>();

  register(parser: DocumentParser): void {
    for (const mime of parser.mimeTypes) {
      this.parsers.set(mime.toLowerCase(), parser);
    }
    for (const ext of parser.fileExtensions) {
      this.parsers.set(ext.toLowerCase(), parser);
    }
  }

  getParser(mimeType: string, filename: string): DocumentParser | null {
    const ext = filename.split(".").pop()?.toLowerCase();
    
    // 1. Try resolving by MIME type
    let parser = this.parsers.get(mimeType.toLowerCase());
    if (parser) return parser;

    // 2. Fallback to resolving by extension
    if (ext) {
      parser = this.parsers.get(`.${ext}`);
      if (parser) return parser;
    }

    return null;
  }
}

// Global Parser Registry Instance
export const globalParserRegistry = new ParserRegistry();

// Auto-register built-in parsers
globalParserRegistry.register(new TxtParser());
globalParserRegistry.register(new MarkdownParser());
globalParserRegistry.register(new PdfParser());
globalParserRegistry.register(new DocxParser());

