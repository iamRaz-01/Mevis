import { type SearchResponse, type SearchFilters, type RetrievalStrategy } from "./context";
import { globalEventBus } from "../pipeline/event-bus";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("SearchCache");

export class SearchCache {
  private readonly cache = new Map<string, { response: SearchResponse; expiresAt: number }>();

  constructor(private readonly cacheDurationMs: number = 300000) {
    // Automatically subscribe to ProcessingCompleted platform events to flush caches
    globalEventBus.subscribe("ProcessingCompleted", (event) => {
      logger.info(`Received ${event.type} event. Invalidating search caches.`);
      this.invalidate();
    });
  }

  get(query: string, strategy: RetrievalStrategy, filters?: SearchFilters): SearchResponse | null {
    const key = this.buildKey(query, strategy, filters);
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  set(query: string, strategy: RetrievalStrategy, response: SearchResponse, filters?: SearchFilters): void {
    const key = this.buildKey(query, strategy, filters);
    this.cache.set(key, {
      response,
      expiresAt: Date.now() + this.cacheDurationMs,
    });
  }

  invalidate(): void {
    this.cache.clear();
    logger.info("Search cache has been completely invalidated.");
  }

  private buildKey(query: string, strategy: RetrievalStrategy, filters?: SearchFilters): string {
    const filtersPart = filters ? JSON.stringify(filters) : "";
    return `${strategy}:${query.trim().toLowerCase()}:${filtersPart}`;
  }
}
