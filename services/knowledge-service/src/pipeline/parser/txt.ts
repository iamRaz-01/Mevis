import { type DocumentParser } from "./registry";
import { type ProcessingContext } from "../context";

export class TxtParser implements DocumentParser {
  readonly formatName = "TXT";
  readonly mimeTypes = ["text/plain"];
  readonly fileExtensions = [".txt"];

  async parse(buffer: Buffer, _context: ProcessingContext): Promise<string> {
    return buffer.toString("utf-8");
  }
}
