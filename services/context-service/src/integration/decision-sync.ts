import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("DecisionSynchronizer");

export class DecisionSynchronizer {
  constructor(private readonly candidateRepo: any) {}

  async synchronize(eventType: string, payload: any): Promise<void> {
    logger.info("Synchronizing Decision Runtime with event", { eventType, payload });

    if (eventType === "IncidentCreated") {
      const incidentId = payload.incidentId;
      const decId = `dec_${incidentId.toLowerCase()}`;
      
      const existing = await this.candidateRepo.findById(decId);
      if (!existing) {
        await this.candidateRepo.save({
          id: decId,
          decision_type: "Medical Response",
          lifecycle_state: "DRAFT",
          context_json: JSON.stringify({ incidentId }),
          constraints_json: JSON.stringify({}),
          manifest_json: JSON.stringify({}),
          created_at: new Date().toISOString(),
        });
        logger.info(`Generated new Decision Candidate "${decId}" from Incident ${incidentId}`);
      }
    }
  }
}
