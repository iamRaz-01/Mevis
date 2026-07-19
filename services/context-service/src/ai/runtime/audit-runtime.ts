import { globalEventBus } from "../../world/event-bus";
import * as crypto from "node:crypto";

/**
 * AiAuditRuntime
 *
 * Produces immutable audit records for every AI interaction.
 * Audit records capture: who, when, which capability, which model,
 * evidence attached, trust package produced, response status, and policy checks.
 *
 * Records are hashed on creation and must never be modified.
 * Used for governance, compliance, and regulatory reporting.
 */

export interface AuditRecord {
  id: string;
  requestId: string;
  actorId: string;
  actorRole: string;
  capability: string;
  modelUsed: string;
  evidenceAttached: number;
  trustPackageId: string;
  responseStatus: string;
  policyChecksPassed: boolean;
  immutableHash: string;
  occurredAt: string;
}

export interface AiAuditRecordRepoPort {
  save(row: {
    id: string;
    request_id: string;
    actor_id: string;
    actor_role: string;
    capability: string;
    model_used: string | null;
    evidence_attached: number;
    trust_package_id: string | null;
    response_status: string;
    policy_checks_passed: number;
    immutable_hash: string;
    occurred_at: string;
  }): Promise<void>;
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
}

function uid(): string {
  return `audit_${Math.random().toString(36).slice(2, 10)}`;
}

function buildHash(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export class AiAuditRuntime {
  constructor(private readonly repo: AiAuditRecordRepoPort) {}

  /**
   * Creates an immutable audit record for a completed AI request lifecycle.
   */
  async record(params: {
    requestId: string;
    actorId: string;
    actorRole: string;
    capability: string;
    modelUsed?: string;
    evidenceAttached?: number;
    trustPackageId?: string;
    responseStatus: string;
    policyChecksPassed?: boolean;
  }): Promise<AuditRecord> {
    const occurredAt = new Date().toISOString();
    const id = uid();

    const hashPayload = {
      id,
      requestId: params.requestId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      capability: params.capability,
      modelUsed: params.modelUsed ?? "UnknownModel",
      responseStatus: params.responseStatus,
      occurredAt,
    };

    const immutableHash = buildHash(hashPayload);

    const record: AuditRecord = {
      id,
      requestId: params.requestId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      capability: params.capability,
      modelUsed: params.modelUsed ?? "UnknownModel",
      evidenceAttached: params.evidenceAttached ?? 0,
      trustPackageId: params.trustPackageId ?? "",
      responseStatus: params.responseStatus,
      policyChecksPassed: params.policyChecksPassed ?? true,
      immutableHash,
      occurredAt,
    };

    await this.repo.save({
      id: record.id,
      request_id: record.requestId,
      actor_id: record.actorId,
      actor_role: record.actorRole,
      capability: record.capability,
      model_used: record.modelUsed,
      evidence_attached: record.evidenceAttached,
      trust_package_id: record.trustPackageId || null,
      response_status: record.responseStatus,
      policy_checks_passed: record.policyChecksPassed ? 1 : 0,
      immutable_hash: record.immutableHash,
      occurred_at: record.occurredAt,
    });

    globalEventBus.publish({ type: "AuditRecorded", payload: { auditId: record.id, requestId: record.requestId }, timestamp: new Date().toISOString() });

    return record;
  }

  /**
   * Returns all audit records (read-only).
   */
  async getAll(): Promise<AuditRecord[]> {
    const rows = await this.repo.findAll();
    return rows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      actorId: r.actor_id,
      actorRole: r.actor_role,
      capability: r.capability,
      modelUsed: r.model_used ?? "UnknownModel",
      evidenceAttached: r.evidence_attached,
      trustPackageId: r.trust_package_id ?? "",
      responseStatus: r.response_status,
      policyChecksPassed: r.policy_checks_passed === 1,
      immutableHash: r.immutable_hash,
      occurredAt: r.occurred_at,
    }));
  }

  /**
   * Retrieves a single audit record by ID.
   */
  async getById(id: string): Promise<AuditRecord | null> {
    const row = await this.repo.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      requestId: row.request_id,
      actorId: row.actor_id,
      actorRole: row.actor_role,
      capability: row.capability,
      modelUsed: row.model_used ?? "UnknownModel",
      evidenceAttached: row.evidence_attached,
      trustPackageId: row.trust_package_id ?? "",
      responseStatus: row.response_status,
      policyChecksPassed: row.policy_checks_passed === 1,
      immutableHash: row.immutable_hash,
      occurredAt: row.occurred_at,
    };
  }
}
