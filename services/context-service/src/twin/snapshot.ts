import { type DigitalTwinContext } from "./context";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("SnapshotManager");

export interface TwinSnapshotRepoPort {
  save(snapshot: {
    readonly id: string;
    readonly snapshot_data_json: string;
    readonly created_at: string;
  }): Promise<void>;
}

export class SnapshotManager {
  constructor(private readonly repo: TwinSnapshotRepoPort) {}

  async createTwinSnapshot(twin: DigitalTwinContext): Promise<string> {
    const id = `twin_snap_${Date.now()}`;
    const createdAt = new Date().toISOString();

    await this.repo.save({
      id,
      snapshot_data_json: JSON.stringify(twin),
      created_at: createdAt,
    });

    await globalEventBus.publish({
      type: "TwinSnapshotCreated",
      timestamp: createdAt,
      payload: { snapshotId: id },
    });

    logger.info(`Digital Twin snapshot "${id}" created and saved successfully.`);
    return id;
  }
}
