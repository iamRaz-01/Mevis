import { type DocumentParser } from "./registry";
import { type ProcessingContext } from "../context";

export class MarkdownParser implements DocumentParser {
  readonly formatName = "Markdown";
  readonly mimeTypes = ["text/markdown", "text/x-markdown"];
  readonly fileExtensions = [".md", ".markdown"];

  async parse(buffer: Buffer, _context: ProcessingContext): Promise<string> {
    return buffer.toString("utf-8");
  }
}
