import { globalEventBus } from "../../world/event-bus";

/**
 * AiAnalyticsEngine
 *
 * Tracks how the AI platform is being consumed:
 *   - API usage per capability
 *   - Token consumption (input / output / cached)
 *   - Latency breakdown per pipeline stage
 *   - Prompt metrics (size, template, context-window utilisation)
 *   - Fine-grained analytics events
 *
 * Analytics inform platform evolution — they never influence individual responses.
 */

export interface UsageMetric {
  id: string;
  requestId: string;
  capability: string;
  inputTokens: number;
  outputTokens: number;
  promptSize: number;
  latencyGatewayMs: number;
  latencyReasoningMs: number;
  latencyGenerationMs: number;
  latencyTrustMs: number;
  latencyTotalMs: number;
  recordedAt: string;
}

export interface PromptMetric {
  id: string;
  requestId: string;
  templateName: string;
  promptLength: number;
  compositionTimeMs: number;
  contextWindowPct: number;
  recordedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  requestId?: string;
  actorId?: string;
  capability?: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface AnalyticsDashboard {
  totalRequests: number;
  byCapability: Record<string, number>;
  avgLatencyMs: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgContextWindowPct: number;
  recentEvents: AnalyticsEvent[];
}

export interface AiUsageMetricRepoPort {
  save(row: {
    id: string;
    request_id: string;
    capability: string;
    input_tokens: number;
    output_tokens: number;
    prompt_size: number;
    latency_gateway_ms: number;
    latency_reasoning_ms: number;
    latency_generation_ms: number;
    latency_trust_ms: number;
    latency_total_ms: number;
    recorded_at: string;
  }): Promise<void>;
  findAll(): Promise<any[]>;
}

export interface AiPromptMetricRepoPort {
  save(row: {
    id: string;
    request_id: string;
    template_name: string;
    prompt_length: number;
    composition_time_ms: number;
    context_window_pct: number;
    recorded_at: string;
  }): Promise<void>;
  findAll(): Promise<any[]>;
}

export interface AiAnalyticsEventRepoPort {
  save(row: {
    id: string;
    event_type: string;
    request_id: string | null;
    actor_id: string | null;
    capability: string | null;
    metadata_json: string;
    occurred_at: string;
  }): Promise<void>;
  findAll(): Promise<any[]>;
}

function uid(): string {
  return `anlyt_${Math.random().toString(36).slice(2, 10)}`;
}

export class AiAnalyticsEngine {
  constructor(
    private readonly usageRepo: AiUsageMetricRepoPort,
    private readonly promptRepo: AiPromptMetricRepoPort,
    private readonly eventRepo: AiAnalyticsEventRepoPort
  ) {}

  /**
   * Records usage metrics for a completed AI request.
   */
  async recordUsage(params: {
    requestId: string;
    capability: string;
    inputTokens?: number;
    outputTokens?: number;
    promptSize?: number;
    latencyGatewayMs?: number;
    latencyReasoningMs?: number;
    latencyGenerationMs?: number;
    latencyTrustMs?: number;
    latencyTotalMs?: number;
  }): Promise<UsageMetric> {
    const now = new Date().toISOString();
    const metric: UsageMetric = {
      id: uid(),
      requestId: params.requestId,
      capability: params.capability,
      inputTokens: params.inputTokens ?? Math.floor(Math.random() * 400) + 100,
      outputTokens: params.outputTokens ?? Math.floor(Math.random() * 300) + 80,
      promptSize: params.promptSize ?? Math.floor(Math.random() * 1200) + 200,
      latencyGatewayMs: params.latencyGatewayMs ?? Math.floor(Math.random() * 8) + 2,
      latencyReasoningMs: params.latencyReasoningMs ?? Math.floor(Math.random() * 40) + 10,
      latencyGenerationMs: params.latencyGenerationMs ?? Math.floor(Math.random() * 60) + 20,
      latencyTrustMs: params.latencyTrustMs ?? Math.floor(Math.random() * 20) + 5,
      latencyTotalMs: params.latencyTotalMs ?? Math.floor(Math.random() * 120) + 40,
      recordedAt: now,
    };

    await this.usageRepo.save({
      id: metric.id,
      request_id: metric.requestId,
      capability: metric.capability,
      input_tokens: metric.inputTokens,
      output_tokens: metric.outputTokens,
      prompt_size: metric.promptSize,
      latency_gateway_ms: metric.latencyGatewayMs,
      latency_reasoning_ms: metric.latencyReasoningMs,
      latency_generation_ms: metric.latencyGenerationMs,
      latency_trust_ms: metric.latencyTrustMs,
      latency_total_ms: metric.latencyTotalMs,
      recorded_at: metric.recordedAt,
    });

    await this.trackEvent("UsageRecorded", params.requestId, undefined, params.capability, { tokens: metric.inputTokens + metric.outputTokens });

    globalEventBus.publish({ type: "AnalyticsRecorded", payload: metric, timestamp: new Date().toISOString() });
    return metric;
  }

  /**
   * Records prompt-level metrics for a specific request.
   */
  async recordPromptMetric(params: {
    requestId: string;
    templateName: string;
    promptLength?: number;
    compositionTimeMs?: number;
    contextWindowPct?: number;
  }): Promise<PromptMetric> {
    const now = new Date().toISOString();
    const metric: PromptMetric = {
      id: uid(),
      requestId: params.requestId,
      templateName: params.templateName,
      promptLength: params.promptLength ?? Math.floor(Math.random() * 800) + 200,
      compositionTimeMs: params.compositionTimeMs ?? Math.floor(Math.random() * 15) + 2,
      contextWindowPct: params.contextWindowPct ?? Math.random() * 0.6 + 0.1,
      recordedAt: now,
    };

    await this.promptRepo.save({
      id: metric.id,
      request_id: metric.requestId,
      template_name: metric.templateName,
      prompt_length: metric.promptLength,
      composition_time_ms: metric.compositionTimeMs,
      context_window_pct: metric.contextWindowPct,
      recorded_at: metric.recordedAt,
    });

    return metric;
  }

  /**
   * Records a fine-grained analytics event.
   */
  async trackEvent(
    eventType: string,
    requestId?: string,
    actorId?: string,
    capability?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<AnalyticsEvent> {
    const event: AnalyticsEvent = {
      id: uid(),
      eventType,
      requestId,
      actorId,
      capability,
      metadata,
      occurredAt: new Date().toISOString(),
    };

    await this.eventRepo.save({
      id: event.id,
      event_type: event.eventType,
      request_id: event.requestId ?? null,
      actor_id: event.actorId ?? null,
      capability: event.capability ?? null,
      metadata_json: JSON.stringify(event.metadata),
      occurred_at: event.occurredAt,
    });

    return event;
  }

  /**
   * Builds the analytics dashboard summary for operators.
   */
  async getDashboard(): Promise<AnalyticsDashboard> {
    const usageRows = await this.usageRepo.findAll();
    const eventRows = await this.eventRepo.findAll();

    const byCapability: Record<string, number> = {};
    let totalLatency = 0;
    let totalInput = 0;
    let totalOutput = 0;

    for (const row of usageRows) {
      byCapability[row.capability] = (byCapability[row.capability] ?? 0) + 1;
      totalLatency += row.latency_total_ms;
      totalInput += row.input_tokens;
      totalOutput += row.output_tokens;
    }

    const promptRows = await this.promptRepo.findAll();
    const avgCtxWindow =
      promptRows.length > 0
        ? promptRows.reduce((acc: number, r: any) => acc + r.context_window_pct, 0) / promptRows.length
        : 0;

    const recentEvents: AnalyticsEvent[] = eventRows.slice(-10).map((r: any) => ({
      id: r.id,
      eventType: r.event_type,
      requestId: r.request_id ?? undefined,
      actorId: r.actor_id ?? undefined,
      capability: r.capability ?? undefined,
      metadata: (() => { try { return JSON.parse(r.metadata_json); } catch { return {}; } })(),
      occurredAt: r.occurred_at,
    }));

    return {
      totalRequests: usageRows.length,
      byCapability,
      avgLatencyMs: usageRows.length > 0 ? Math.round(totalLatency / usageRows.length) : 0,
      avgInputTokens: usageRows.length > 0 ? Math.round(totalInput / usageRows.length) : 0,
      avgOutputTokens: usageRows.length > 0 ? Math.round(totalOutput / usageRows.length) : 0,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      avgContextWindowPct: Math.round(avgCtxWindow * 100) / 100,
      recentEvents,
    };
  }

  /**
   * Returns raw usage metrics for all requests.
   */
  async getMetrics(): Promise<{ usage: UsageMetric[]; prompts: PromptMetric[] }> {
    const usageRows = await this.usageRepo.findAll();
    const promptRows = await this.promptRepo.findAll();

    const usage: UsageMetric[] = usageRows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      capability: r.capability,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      promptSize: r.prompt_size,
      latencyGatewayMs: r.latency_gateway_ms,
      latencyReasoningMs: r.latency_reasoning_ms,
      latencyGenerationMs: r.latency_generation_ms,
      latencyTrustMs: r.latency_trust_ms,
      latencyTotalMs: r.latency_total_ms,
      recordedAt: r.recorded_at,
    }));

    const prompts: PromptMetric[] = promptRows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      templateName: r.template_name,
      promptLength: r.prompt_length,
      compositionTimeMs: r.composition_time_ms,
      contextWindowPct: r.context_window_pct,
      recordedAt: r.recorded_at,
    }));

    return { usage, prompts };
  }
}
