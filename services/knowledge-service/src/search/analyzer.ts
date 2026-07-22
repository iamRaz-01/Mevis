import { type SearchFilters } from "./context";

export interface AnalyzedQuery {
  readonly originalQuery: string;
  readonly cleanQueryText: string; // Query with filters removed
  readonly tokens: readonly string[];
  readonly detectedLanguage: string;
  readonly inlineFilters: SearchFilters;
}

export class QueryAnalyzer {
  private readonly stopwords: Record<string, string[]> = {
    English: ["the", "and", "you", "that", "with", "this", "for", "from", "have", "are"],
    Spanish: ["el", "la", "los", "que", "con", "para", "este", "una", "del", "por"],
    French: ["le", "la", "les", "que", "avec", "pour", "dans", "une", "des", "sur"],
  };

  analyze(query: string): AnalyzedQuery {
    const trimmed = (query || "").trim();
    if (!trimmed) {
      return {
        originalQuery: "",
        cleanQueryText: "",
        tokens: [],
        detectedLanguage: "English",
        inlineFilters: {},
      };
    }

    // 1. Parse inline filters like "category:Operations" or "tag:security"
    const inlineFilters: Record<string, any> = {};
    const filterRegex = /\b(category|language|ownerId|assetId|lifecycleState|tag):([^\s"]+|"[^"]+")/gi;
    
    let cleanQuery = trimmed;
    let match;
    const tagsList: string[] = [];

    while ((match = filterRegex.exec(trimmed)) !== null) {
      const key = match[1].toLowerCase();
      const val = match[2].replace(/"/g, "").trim();

      if (key === "tag") {
        tagsList.push(val);
      } else {
        // Map keys to camelCase filters
        const filterKey = key === "ownerid" ? "ownerId" 
                        : key === "lifecyclestate" ? "lifecycleState" 
                        : key;
        inlineFilters[filterKey] = val;
      }
    }

    if (tagsList.length > 0) {
      inlineFilters.tags = tagsList;
    }

    // Strip inline filters from query text
    cleanQuery = cleanQuery.replace(filterRegex, "").replace(/\s+/g, " ").trim();

    // 2. Tokenize and clean text tokens
    const punctuationRegex = /[^\w\s-]/g;
    const tokens = cleanQuery
      .toLowerCase()
      .replace(punctuationRegex, "")
      .split(/\s+/)
      .filter(Boolean);

    // 3. Detect query language
    let detectedLang = "English";
    const arabicRegex = /[\u0600-\u06FF]/;
    const hindiRegex = /[\u0900-\u097F]/;

    if (arabicRegex.test(cleanQuery)) {
      detectedLang = "Arabic";
    } else if (hindiRegex.test(cleanQuery)) {
      detectedLang = "Hindi";
    } else if (tokens.length > 0) {
      const counts: Record<string, number> = { English: 0, Spanish: 0, French: 0 };
      for (const token of tokens) {
        for (const [lang, list] of Object.entries(this.stopwords)) {
          if (list.includes(token)) {
            counts[lang]++;
          }
        }
      }
      let maxCount = 0;
      for (const [lang, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          detectedLang = lang;
        }
      }
    }

    return {
      originalQuery: trimmed,
      cleanQueryText: cleanQuery,
      tokens,
      detectedLanguage: detectedLang,
      inlineFilters,
    };
  }
}
