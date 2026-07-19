/**
 * AiPlaybackEngine
 *
 * Reconstructs full AI interaction lifecycles from stored snapshots.
 * Playback records contain: user request, reasoning artifacts,
 * generated response, trust package, and delivery metadata.
 *
 * Used for: debugging, compliance audits, operational analysis,
 * and team retrospectives. Never exposes internal model reasoning.
 */

export interface PlaybackRecord {
  id: string;
  requestId: string;
  userRequest: string;
  reasoningSnapshot: Record<string, unknown>;
  generationSnapshot: Record<string, unknown>;
  trustSnapshot: Record<string, unknown>;
  deliveryMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface AiPlaybackRecordRepoPort {
  save(row: {
    id: string;
    request_id: string;
    user_request: string;
    reasoning_snapshot: string;
    generation_snapshot: string;
    trust_snapshot: string;
    delivery_metadata: string;
    created_at: string;
  }): Promise<void>;
  findAll(): Promise<any[]>;
  findByRequestId(requestId: string): Promise<any | null>;
}

function uid(): string {
  return `play_${Math.random().toString(36).slice(2, 10)}`;
}

export class AiPlaybackEngine {
  constructor(private readonly repo: AiPlaybackRecordRepoPort) {}

  /**
   * Stores a complete playback snapshot for an AI interaction.
   */
  async recordPlayback(params: {
    requestId: string;
    userRequest: string;
    reasoningSnapshot?: Record<string, unknown>;
    generationSnapshot?: Record<string, unknown>;
    trustSnapshot?: Record<string, unknown>;
    deliveryMetadata?: Record<string, unknown>;
  }): Promise<PlaybackRecord> {
    const record: PlaybackRecord = {
      id: uid(),
      requestId: params.requestId,
      userRequest: params.userRequest,
      reasoningSnapshot: params.reasoningSnapshot ?? {},
      generationSnapshot: params.generationSnapshot ?? {},
      trustSnapshot: params.trustSnapshot ?? {},
      deliveryMetadata: params.deliveryMetadata ?? {},
      createdAt: new Date().toISOString(),
    };

    await this.repo.save({
      id: record.id,
      request_id: record.requestId,
      user_request: record.userRequest,
      reasoning_snapshot: JSON.stringify(record.reasoningSnapshot),
      generation_snapshot: JSON.stringify(record.generationSnapshot),
      trust_snapshot: JSON.stringify(record.trustSnapshot),
      delivery_metadata: JSON.stringify(record.deliveryMetadata),
      created_at: record.createdAt,
    });

    return record;
  }

  /**
   * Reconstructs the full interaction lifecycle by requestId.
   */
  async reconstructInteraction(requestId: string): Promise<PlaybackRecord | null> {
    const row = await this.repo.findByRequestId(requestId);
    if (!row) return null;

    const parseJson = (s: string): Record<string, unknown> => {
      try { return JSON.parse(s); } catch { return {}; }
    };

    return {
      id: row.id,
      requestId: row.request_id,
      userRequest: row.user_request,
      reasoningSnapshot: parseJson(row.reasoning_snapshot),
      generationSnapshot: parseJson(row.generation_snapshot),
      trustSnapshot: parseJson(row.trust_snapshot),
      deliveryMetadata: parseJson(row.delivery_metadata),
      createdAt: row.created_at,
    };
  }

  /**
   * Returns all playback records (paginated summary).
   */
  async listRecords(): Promise<Array<{ id: string; requestId: string; userRequest: string; createdAt: string }>> {
    const rows = await this.repo.findAll();
    return rows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      userRequest: r.user_request,
      createdAt: r.created_at,
    }));
  }
}
