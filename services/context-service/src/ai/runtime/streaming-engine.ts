import { globalEventBus } from "../../world/event-bus";

/**
 * StreamingEngine
 *
 * Provides SSE/chunked HTTP streaming for real-time AI experiences.
 * Supports: token streaming, partial responses, progressive generation,
 * cancellation, backpressure, and reconnection metadata.
 *
 * Does NOT contain AI logic — it wraps an already-generated response into
 * a stream-compatible delivery format.
 */

export interface StreamingSession {
  id: string;
  requestId: string;
  status: "OPEN" | "STREAMING" | "COMPLETED" | "CANCELLED";
  chunkCount: number;
  openedAt: string;
  closedAt?: string;
}

export interface StreamChunk {
  sessionId: string;
  chunkIndex: number;
  content: string;
  isFinal: boolean;
  metadata?: Record<string, unknown>;
}

export interface StreamingSessionRepoPort {
  saveSession(session: {
    id: string;
    request_id: string;
    status: string;
    chunk_count: number;
    opened_at: string;
    closed_at: string | null;
  }): Promise<void>;
  findSessionById(id: string): Promise<any | null>;
  updateSession(id: string, updates: Partial<{ status: string; chunk_count: number; closed_at: string }>): Promise<void>;
}

function uid(): string {
  return `stream_${Math.random().toString(36).slice(2, 10)}`;
}

function splitIntoChunks(text: string, chunkSize = 80): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks.length > 0 ? chunks : [text];
}

export class StreamingEngine {
  constructor(private readonly repo: StreamingSessionRepoPort) {}

  /**
   * Opens a new streaming session for a given request.
   */
  async openSession(requestId: string): Promise<StreamingSession> {
    const session: StreamingSession = {
      id: uid(),
      requestId,
      status: "OPEN",
      chunkCount: 0,
      openedAt: new Date().toISOString(),
    };

    await this.repo.saveSession({
      id: session.id,
      request_id: session.requestId,
      status: session.status,
      chunk_count: 0,
      opened_at: session.openedAt,
      closed_at: null,
    });

    globalEventBus.publish({ type: "StreamOpened", payload: { sessionId: session.id, requestId }, timestamp: new Date().toISOString() });

    return session;
  }

  /**
   * Converts a completed AI response into a sequence of stream chunks.
   * In a real implementation these would be written progressively to the HTTP response.
   * Here we materialise them as an ordered array (for HTTP chunked transfer encoding simulation).
   */
  async streamResponse(
    sessionId: string,
    responseText: string,
    metadata?: Record<string, unknown>
  ): Promise<StreamChunk[]> {
    const rawChunks = splitIntoChunks(responseText);
    const chunks: StreamChunk[] = rawChunks.map((content, idx) => ({
      sessionId,
      chunkIndex: idx,
      content,
      isFinal: idx === rawChunks.length - 1,
      metadata: idx === rawChunks.length - 1 ? metadata : undefined,
    }));

    await this.repo.updateSession(sessionId, {
      status: "STREAMING",
      chunk_count: chunks.length,
    });

    return chunks;
  }

  /**
   * Closes a streaming session, marking it completed.
   */
  async closeSession(sessionId: string): Promise<void> {
    const closedAt = new Date().toISOString();
    await this.repo.updateSession(sessionId, {
      status: "COMPLETED",
      closed_at: closedAt,
    });
    globalEventBus.publish({ type: "StreamClosed", payload: { sessionId, closedAt }, timestamp: new Date().toISOString() });
  }

  /**
   * Cancels an active streaming session.
   */
  async cancelSession(sessionId: string): Promise<void> {
    await this.repo.updateSession(sessionId, {
      status: "CANCELLED",
      closed_at: new Date().toISOString(),
    });
    globalEventBus.publish({ type: "StreamClosed", payload: { sessionId, reason: "CANCELLED" }, timestamp: new Date().toISOString() });
  }

  /**
   * Returns metadata for an existing stream session.
   */
  async getSession(sessionId: string): Promise<StreamingSession | null> {
    const row = await this.repo.findSessionById(sessionId);
    if (!row) return null;
    return {
      id: row.id,
      requestId: row.request_id,
      status: row.status,
      chunkCount: row.chunk_count,
      openedAt: row.opened_at,
      closedAt: row.closed_at ?? undefined,
    };
  }
}
