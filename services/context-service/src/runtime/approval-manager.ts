import { type DecisionRuntimeState, type DecisionLifecycleState, type TimelineEntry } from "./context";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";

const logger = new StructuredLogger("ApprovalManager");

export interface DecisionRuntimeStateRepoPort {
  save(state: {
    readonly id: string;
    readonly lifecycle_state: string;
    readonly approver: string | null;
    readonly reviewed_at: string | null;
    readonly timeline_json: string;
    readonly updated_at: string;
  }): Promise<void>;
  findById(id: string): Promise<any>;
}

export class ApprovalManager {
  constructor(private readonly repo: DecisionRuntimeStateRepoPort) {}

  async publishDecision(id: string): Promise<DecisionRuntimeState> {
    const timestamp = new Date().toISOString();
    const timeline: TimelineEntry[] = [{
      state: "PUBLISHED",
      timestamp,
      actor: "SYSTEM",
      comment: "Decision published for downstream consumption.",
    }];

    const state: DecisionRuntimeState = {
      id,
      lifecycleState: "PUBLISHED",
      approver: null,
      reviewedAt: null,
      timeline,
      updatedAt: timestamp,
    };

    await this.repo.save(this.serializeState(state));
    await globalEventBus.publish({
      type: "DecisionPublished",
      timestamp,
      payload: { decisionId: id },
    });

    metrics.counter("world_decisions_published_total").increment();
    return state;
  }

  async requestApproval(id: string): Promise<DecisionRuntimeState> {
    const row = await this.repo.findById(id);
    const existing = row ? this.deserializeState(row) : await this.publishDecision(id);

    const timestamp = new Date().toISOString();
    const timeline = [...existing.timeline, {
      state: "PENDING_APPROVAL" as DecisionLifecycleState,
      timestamp,
      actor: "SYSTEM",
      comment: "Human approval requested.",
    }];

    const state: DecisionRuntimeState = {
      ...existing,
      lifecycleState: "PENDING_APPROVAL",
      timeline,
      updatedAt: timestamp,
    };

    await this.repo.save(this.serializeState(state));
    await globalEventBus.publish({
      type: "ApprovalRequested",
      timestamp,
      payload: { decisionId: id },
    });

    return state;
  }

  async approveDecision(id: string, approver: string): Promise<DecisionRuntimeState> {
    const row = await this.repo.findById(id);
    if (!row) throw new Error(`Decision state for "${id}" not found.`);
    const existing = this.deserializeState(row);

    if (existing.lifecycleState !== "PENDING_APPROVAL") {
      throw new Error(`Cannot approve decision in "${existing.lifecycleState}" state.`);
    }

    const timestamp = new Date().toISOString();
    const timeline = [...existing.timeline, {
      state: "APPROVED" as DecisionLifecycleState,
      timestamp,
      actor: approver,
      comment: `Decision approved by ${approver}.`,
    }];

    const state: DecisionRuntimeState = {
      id,
      lifecycleState: "APPROVED",
      approver,
      reviewedAt: timestamp,
      timeline,
      updatedAt: timestamp,
    };

    await this.repo.save(this.serializeState(state));
    await globalEventBus.publish({
      type: "DecisionApproved",
      timestamp,
      payload: { decisionId: id, approver },
    });

    metrics.counter("world_decisions_approved_total").increment();
    return state;
  }

  async rejectDecision(id: string, approver: string): Promise<DecisionRuntimeState> {
    const row = await this.repo.findById(id);
    if (!row) throw new Error(`Decision state for "${id}" not found.`);
    const existing = this.deserializeState(row);

    const timestamp = new Date().toISOString();
    const timeline = [...existing.timeline, {
      state: "REJECTED" as DecisionLifecycleState,
      timestamp,
      actor: approver,
      comment: `Decision rejected by ${approver}.`,
    }];

    const state: DecisionRuntimeState = {
      id,
      lifecycleState: "REJECTED",
      approver,
      reviewedAt: timestamp,
      timeline,
      updatedAt: timestamp,
    };

    await this.repo.save(this.serializeState(state));
    await globalEventBus.publish({
      type: "DecisionRejected",
      timestamp,
      payload: { decisionId: id, approver },
    });

    metrics.counter("world_decisions_rejected_total").increment();
    return state;
  }

  private serializeState(s: DecisionRuntimeState) {
    return {
      id: s.id,
      lifecycle_state: s.lifecycleState,
      approver: s.approver,
      reviewed_at: s.reviewedAt,
      timeline_json: JSON.stringify(s.timeline),
      updated_at: s.updatedAt,
    };
  }

  private deserializeState(row: any): DecisionRuntimeState {
    return {
      id: row.id,
      lifecycleState: row.lifecycle_state as DecisionLifecycleState,
      approver: row.approver,
      reviewedAt: row.reviewed_at,
      timeline: row.timeline_json ? JSON.parse(row.timeline_json) : [],
      updatedAt: row.updated_at,
    };
  }
}
