import { type ProcessingContext } from "./context";

export class LanguageDetector {
  private readonly stopwords: Record<string, string[]> = {
    English: ["the", "and", "you", "that", "with", "this", "for", "from", "have", "are"],
    Spanish: ["el", "la", "los", "que", "con", "para", "este", "una", "del", "por"],
    French: ["le", "la", "les", "que", "avec", "pour", "dans", "une", "des", "sur"],
  };

  detect(context: ProcessingContext): string {
    const text = context.normalizedText || "";
    if (!text) {
      context.language = "English";
      return "English";
    }

    // 1. Check Unicode character ranges first for high-confidence match
    const arabicRegex = /[\u0600-\u06FF]/;
    const hindiRegex = /[\u0900-\u097F]/;

    if (arabicRegex.test(text)) {
      context.language = "Arabic";
      return "Arabic";
    }
    if (hindiRegex.test(text)) {
      context.language = "Hindi";
      return "Hindi";
    }

    // 2. Fallback to Stopword matching density for Latin alphabet languages
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = { English: 0, Spanish: 0, French: 0 };

    for (const word of words) {
      for (const [lang, list] of Object.entries(this.stopwords)) {
        if (list.includes(word)) {
          wordCounts[lang]++;
        }
      }
    }

    let detectedLang = "English";
    let maxCount = 0;

    for (const [lang, count] of Object.entries(wordCounts)) {
      if (count > maxCount) {
        maxCount = count;
        detectedLang = lang;
      }
    }

    context.language = detectedLang;
    return detectedLang;
  }
}
