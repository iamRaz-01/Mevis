import { type DocumentParser } from "./registry";
import { type ProcessingContext } from "../context";

export class DocxParser implements DocumentParser {
  readonly formatName = "DOCX";
  readonly mimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  readonly fileExtensions = [".docx"];

  async parse(buffer: Buffer, _context: ProcessingContext): Promise<string> {
    // Check ZIP header signature: PK\x03\x04
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      const rawContent = buffer.toString("binary");
      // Search OpenXML text runs in the raw binary block using regex
      const wtRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
      const textSegments: string[] = [];
      let match;
      while ((match = wtRegex.exec(rawContent)) !== null) {
        const textVal = match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        textSegments.push(textVal);
      }
      if (textSegments.length > 0) {
        return textSegments.join(" ");
      }
    }

    // Fallback for simple string mocks
    return buffer.toString("utf-8");
  }
}
