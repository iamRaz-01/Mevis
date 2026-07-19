import { type Intent } from "./context";
import crypto from "node:crypto";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("IntentEngine");

export class IntentEngine {
  constructor(private readonly intentRepo: any) {}

  async detectIntent(query: string): Promise<Intent> {
    const q = query.toLowerCase();
    let type = "OPERATIONAL_QUERY";
    let confidence = 0.85;

    if (q.includes("where") || q.includes("gate") || q.includes("map") || q.includes("go") || q.includes("direction")) {
      type = "NAVIGATION";
      confidence = 0.95;
    } else if (q.includes("volunteer") || q.includes("person") || q.includes("carlos") || q.includes("who is")) {
      type = "VOLUNTEER_LOOKUP";
      confidence = 0.92;
    } else if (q.includes("report") || q.includes("summary") || q.includes("generate") || q.includes("analytics")) {
      type = "REPORT_GENERATION";
      confidence = 0.90;
    }

    const id = `int_${crypto.randomUUID().slice(0, 8)}`;
    await this.intentRepo.save({
      id,
      query,
      intent_type: type,
      confidence,
      created_at: new Date().toISOString(),
    });

    logger.info(`Detected intent "${type}" for query "${query}" with confidence ${confidence}.`);
    return { query, intentType: type, confidence };
  }
}
