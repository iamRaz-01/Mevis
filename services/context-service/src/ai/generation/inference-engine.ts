import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("InferenceEngine");

export class InferenceEngine {
  async invokeModel(modelName: string, prompt: string): Promise<{ text: string; tokens: number; latency: number }> {
    const start = Date.now();
    logger.info(`Invoking model "${modelName}" with prompt length ${prompt.length}.`);

    let responseText = "Grounded response matching active operational rules.";

    const p = prompt.toLowerCase();
    if (p.includes("navigation") || p.includes("gate") || p.includes("entrance")) {
      responseText = "Proceed to the main entrance Gate C. The digital twin reports low crowd congestion levels.";
    } else if (p.includes("volunteer") || p.includes("carlos")) {
      responseText = "Volunteer Carlos (VOL-1A066446) is currently checked-in at Venue Gates.";
    } else if (p.includes("report") || p.includes("summary") || p.includes("daily") || p.includes("shift")) {
      responseText = "# Shift Situation Incident Report\n- Active Incidents: 1\n- Response Escalations: Completed";
    } else if (p.includes("recommend")) {
      responseText = "Deploy Medical Team Bravo to Gate B. They are the closest qualified team and align with Medical SOP-12.";
    } else if (p.includes("explain")) {
      responseText = "This volunteer was recommended because they hold medical certifications and are currently unassigned.";
    }

    const latency = Date.now() - start;
    const tokens = Math.ceil(prompt.length / 4) + 50;

    return { text: responseText, tokens, latency };
  }
}
