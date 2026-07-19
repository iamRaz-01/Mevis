import { StructuredLogger } from "@mevis/logger";
import { type WorldEntityRepoPort } from "../world/orchestrator";

const logger = new StructuredLogger("DigitalTwinSynchronizer");

export class DigitalTwinSynchronizer {
  constructor(private readonly entityRepo: WorldEntityRepoPort) {}

  async synchronize(eventType: string, payload: any): Promise<void> {
    logger.info("Synchronizing Digital Twin with event", { eventType, payload });

    if (eventType === "AttendanceCheckedIn" || eventType === "AttendanceCheckedOut") {
      const volId = payload.volunteerId;
      const status = eventType === "AttendanceCheckedIn" ? "CHECKED_IN" : "CHECKED_OUT";
      
      const volEntity = await this.entityRepo.findEntityById(volId);
      if (volEntity) {
        const metadata = volEntity.metadata_json ? JSON.parse(volEntity.metadata_json) : {};
        metadata.status = status;
        
        await this.entityRepo.saveEntity({
          ...volEntity,
          metadata_json: JSON.stringify(metadata)
        });
        logger.info(`Updated Digital Twin volunteer ${volId} state to ${status}`);
      }
    }
  }
}
