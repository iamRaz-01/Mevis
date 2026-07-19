import { type ProcessingContext } from "./context";

export class DocumentCleaner {
  clean(context: ProcessingContext): string {
    const text = context.rawText || "";

    // 1. Normalize line endings to LF (\n)
    let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 2. Remove control characters (excluding \n and \t)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // 3. Remove invisible Unicode characters (like zero-width space, BOM)
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, "");

    // 4. Normalize curly quotation marks
    cleaned = cleaned
      .replace(/[\u201C\u201D]/g, '"') // Curly double quotes
      .replace(/[\u2018\u2019]/g, "'"); // Curly single quotes

    // 5. Replace various bullet formats with standard list dash bullet
    cleaned = cleaned.replace(/^[ \t]*[•▪◦*][ \t]*/gm, "- ");

    // 6. Reduce multi-spaces/tabs (excluding newlines)
    cleaned = cleaned.replace(/[ \t]+/g, " ");

    context.cleanedText = cleaned;
    return cleaned;
  }
}
