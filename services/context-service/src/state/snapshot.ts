import crypto from "node:crypto";

export interface WorldSnapshot {
  readonly id: string;
  readonly snapshotTime: string;
  readonly snapshotData: Record<string, any>; 
  readonly createdAt: string;
}

export interface SnapshotRepoPort {
  saveSnapshot(snapshot: {
    id: string;
    snapshot_time: string;
    snapshot_data: string;
    created_at: string;
  }): Promise<void>;
  findSnapshotById(id: string): Promise<any>;
  findAllSnapshots(): Promise<readonly any[]>;
}

export class SnapshotEngine {
  constructor(private readonly repo: SnapshotRepoPort) {}

  async takeSnapshot(states: readonly any[]): Promise<WorldSnapshot> {
    const snapshotData: Record<string, any> = {};
    for (const st of states) {
      snapshotData[st.entityId] = st.stateData;
    }

    const snapshot: WorldSnapshot = {
      id: crypto.randomUUID(),
      snapshotTime: new Date().toISOString(),
      snapshotData,
      createdAt: new Date().toISOString(),
    };

    await this.repo.saveSnapshot({
      id: snapshot.id,
      snapshot_time: snapshot.snapshotTime,
      snapshot_data: JSON.stringify(snapshot.snapshotData),
      created_at: snapshot.createdAt,
    });

    return snapshot;
  }

  async getSnapshot(id: string): Promise<WorldSnapshot | null> {
    const row = await this.repo.findSnapshotById(id);
    if (!row) return null;
    return {
      id: row.id,
      snapshotTime: row.snapshot_time,
      snapshotData: JSON.parse(row.snapshot_data),
      createdAt: row.created_at,
    };
  }

  async getAllSnapshots(): Promise<readonly WorldSnapshot[]> {
    const rows = await this.repo.findAllSnapshots();
    return rows.map(r => ({
      id: r.id,
      snapshotTime: r.snapshot_time,
      snapshotData: r.snapshot_data ? JSON.parse(r.snapshot_data) : {},
      createdAt: r.created_at,
    }));
  }
}
