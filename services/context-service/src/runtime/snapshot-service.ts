import { type DecisionSnapshot } from "./context";
import { globalEventBus } from "../world/event-bus";
import crypto from "node:crypto";

export interface DecisionSnapshotRepoPort {
  save(snap: {
    readonly id: string;
    readonly snapshot_data_json: string;
    readonly created_at: string;
  }): Promise<void>;
}

export class SnapshotService {
  constructor(private readonly repo: DecisionSnapshotRepoPort) {}

  async captureSnapshot(decisionsList: any): Promise<DecisionSnapshot> {
    const timestamp = new Date().toISOString();
    const id = `snap_dec_${crypto.randomUUID()}`;

    const snap: DecisionSnapshot = {
      id,
      snapshotData: decisionsList,
      createdAt: timestamp,
    };

    await this.repo.save({
      id,
      snapshot_data_json: JSON.stringify(snap),
      created_at: timestamp,
    });

    await globalEventBus.publish({
      type: "DecisionSnapshotCreated",
      timestamp,
      payload: { snapshotId: id },
    });

    return snap;
  }
}
