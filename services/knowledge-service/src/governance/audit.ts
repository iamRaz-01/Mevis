import crypto from "node:crypto";

export interface AuditRecord {
  readonly id: string;
  readonly assetId: string;
  readonly eventType: string;
  readonly details: string; 
  readonly createdAt: string;
}

export interface AuditEngineRepoPort {
  saveAuditRecord(record: AuditRecord): Promise<void>;
  findAuditRecordsByAssetId(assetId: string): Promise<readonly AuditRecord[]>;
}

export class AuditEngine {
  constructor(private readonly repoPort: AuditEngineRepoPort) {}

  async logEvent(assetId: string, eventType: string, details: Record<string, any>): Promise<void> {
    const record: AuditRecord = {
      id: crypto.randomUUID(),
      assetId,
      eventType,
      details: JSON.stringify(details),
      createdAt: new Date().toISOString(),
    };
    await this.repoPort.saveAuditRecord(record);
  }
}
