import { type DigitalTwinContext } from "./context";
import { type DigitalTwinRegistry } from "./registry";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("PlaybackService");

export interface TwinSnapshotReaderPort {
  findById(id: string): Promise<any | null>;
}

export class PlaybackService {
  constructor(
    private readonly reader: TwinSnapshotReaderPort,
    private readonly registry: DigitalTwinRegistry
  ) {}

  async replaySnapshot(snapshotId: string): Promise<DigitalTwinContext> {
    logger.info(`Starting historical playback replay for snapshot "${snapshotId}".`);

    const row = await this.reader.findById(snapshotId);
    if (!row) {
      throw new Error(`Snapshot "${snapshotId}" not found for playback replay.`);
    }

    const twinContext = JSON.parse(row.snapshot_data_json) as DigitalTwinContext;
    this.registry.setTwinContext(twinContext);

    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "TwinPlaybackStarted",
      timestamp,
      payload: { snapshotId },
    });

    logger.info(`Historical playback replay completed successfully for snapshot "${snapshotId}".`);
    return twinContext;
  }
}
