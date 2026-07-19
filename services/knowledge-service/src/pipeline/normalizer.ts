import { type ProcessingContext } from "./context";

export class DocumentNormalizer {
  normalize(context: ProcessingContext): string {
    const text = context.cleanedText || "";

    // 1. Unicode Normalization Form Canonical Composition (NFC)
    let normalized = text.normalize("NFC");

    // 2. Clear any double spaces or excess layout whitespace from lines
    normalized = normalized.split("\n")
      .map(line => line.trim())
      .join("\n");

    // 3. Normalize paragraph line gaps (restrict to at most 2 consecutive newlines)
    normalized = normalized.replace(/\n{3,}/g, "\n\n");

    // 4. Remove leading/trailing file padding
    normalized = normalized.trim();

    context.normalizedText = normalized;
    return normalized;
  }
}
