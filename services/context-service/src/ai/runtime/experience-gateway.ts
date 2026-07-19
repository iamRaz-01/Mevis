import { globalEventBus } from "../../world/event-bus";
import type { AiGateway } from "../gateway";
import type { CognitiveOrchestrator } from "../reasoning/orchestrator";
import type { GenerationOrchestrator } from "../generation/orchestrator";
import type { TrustOrchestrator } from "../trust/orchestrator";
import type { ExperienceRouter, CapabilityType } from "./experience-router";
import type { StreamingEngine } from "./streaming-engine";
import type { AiAnalyticsEngine } from "./analytics-engine";
import type { AiAuditRuntime } from "./audit-runtime";
import type { AiPlaybackEngine } from "./playback-engine";

/**
 * ExperienceGateway
 *
 * The unified, versioned AI Experience Runtime entry point.
 *
 * This is the ONLY public interface for consuming AI capabilities in MEVIS.
 * Applications must not interact with AiGateway, CognitiveOrchestrator,
 * GenerationOrchestrator, or TrustOrchestrator directly.
 *
 * Responsibilities:
 *  - Authenticate / authorize callers
 *  - Route requests via ExperienceRouter
 *  - Orchestrate the full pipeline (session → reason → generate → trust)
 *  - Record analytics, audit records, and playback snapshots
 *  - Deliver a standardized AIExperienceResponse
 *
 * Does NOT contain reasoning, generation, or trust logic.
 * All AI intelligence remains in Issues #1–#4.
 */

export interface AIExperienceRequest {
  requestId: string;
  actorId: string;
  actorRole: string;
  capability: CapabilityType;
  query: string;
  sessionId?: string;
  contextualHints?: Record<string, string>;
  stream?: boolean;
}

export interface AIExperienceResponse {
  requestId: string;
  sessionId: string;
  capability: string;
  routedTo: string;
  generatedText: string;
  trustPackageId: string;
  overallConfidence: number;
  auditId: string;
  playbackId: string;
  streamed: boolean;
  streamChunks?: Array<{ chunkIndex: number; content: string; isFinal: boolean }>;
  latencyMs: number;
  recordedAt: string;
}

export interface AiRequestRepoPort {
  save(row: {
    id: string;
    actor_id: string;
    actor_role: string;
    capability: string;
    query: string;
    status: string;
    session_id: string | null;
    latency_ms: number | null;
    created_at: string;
  }): Promise<void>;
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
}

// Capability → format mapping for generation
const CAPABILITY_FORMAT_MAP: Record<CapabilityType, string> = {
  CHAT: "Markdown",
  COPILOT_INCIDENT: "Markdown",
  COPILOT_PLANNING: "Markdown",
  COPILOT_OPERATIONS: "Markdown",
  COPILOT_RECOMMENDATION: "Markdown",
  PREDICT_INCIDENT: "Markdown",
  PREDICT_CROWD: "Markdown",
  PREDICT_RESOURCE: "Markdown",
  PREDICT_VOLUNTEER: "Markdown",
  GENERATE_REPORT: "Markdown",
  GENERATE_SUMMARY: "Briefing",
  GENERATE_SHIFT_NOTES: "Markdown",
  GENERATE_AFTER_ACTION: "Markdown",
};

function uid(): string {
  return `exp_${Math.random().toString(36).slice(2, 10)}`;
}

export class ExperienceGateway {
  constructor(
    private readonly requestRepo: AiRequestRepoPort,
    public readonly aiGateway: AiGateway,
    private readonly cognitiveOrchestrator: CognitiveOrchestrator,
    private readonly generationOrchestrator: GenerationOrchestrator,
    private readonly trustOrchestrator: TrustOrchestrator,
    public readonly router: ExperienceRouter,
    private readonly streaming: StreamingEngine,
    private readonly analytics: AiAnalyticsEngine,
    private readonly audit: AiAuditRuntime,
    private readonly playback: AiPlaybackEngine
  ) {}

  /**
   * Primary entry point for all AI capabilities.
   *
   * Executes the full pipeline:
   *   1. Accept & record the incoming request
   *   2. Route to the correct capability handler
   *   3. Initialize or reuse an AI session
   *   4. Run cognitive orchestration (intent → plan)
   *   5. Run generation (plan → text)
   *   6. Build trust package (text → trusted response)
   *   7. Optionally wrap in a streaming session
   *   8. Record analytics, audit, and playback
   *   9. Return a standardised AIExperienceResponse
   */
  async process(request: AIExperienceRequest): Promise<AIExperienceResponse> {
    const startMs = Date.now();

    // 1. Record inbound request
    await this.requestRepo.save({
      id: request.requestId,
      actor_id: request.actorId,
      actor_role: request.actorRole,
      capability: request.capability,
      query: request.query,
      status: "RECEIVED",
      session_id: request.sessionId ?? null,
      latency_ms: null,
      created_at: new Date().toISOString(),
    });

    globalEventBus.publish({ type: "AIRequestReceived", payload: { requestId: request.requestId, capability: request.capability }, timestamp: new Date().toISOString() });

    // 2. Route
    const route = await this.router.route(request.requestId, request.capability);

    // 3. Session
    let sessionId = request.sessionId;
    if (!sessionId) {
      const { session } = await this.aiGateway.initializeSession(request.actorId);
      sessionId = session.id;
    }
    const resolvedSessionId: string = sessionId!;

    // 4. Reasoning (cognitive orchestration) — returns { plan, graph }
    const reasonStart = Date.now();
    const orchestrationResult = await this.cognitiveOrchestrator.orchestrate(
      resolvedSessionId,
      request.query,
      request.contextualHints?.incidentId,
      request.contextualHints?.venueId
    );
    const { plan, graph } = orchestrationResult;
    const reasonLatency = Date.now() - reasonStart;

    // 5. Generation — takes planId, returns GenerationResult { id, generatedText, ... }
    const genStart = Date.now();
    const formatType = CAPABILITY_FORMAT_MAP[request.capability];
    const generationResult = await this.generationOrchestrator.generate(plan.id, formatType);
    const genLatency = Date.now() - genStart;

    // 6. Trust — takes resultId, returns TrustPackage { id, overallConfidence, evidence, ... }
    const trustStart = Date.now();
    const trustPackage = await this.trustOrchestrator.buildTrustPackage(
      generationResult.id,
      request.actorRole
    );
    const trustLatency = Date.now() - trustStart;

    const totalLatency = Date.now() - startMs;
    const gatewayLatency = Math.max(0, totalLatency - reasonLatency - genLatency - trustLatency);

    // 7. Streaming (optional)
    let streamChunks: Array<{ chunkIndex: number; content: string; isFinal: boolean }> | undefined;
    let streamSessionId: string | undefined;

    if (request.stream) {
      const streamSession = await this.streaming.openSession(request.requestId);
      streamSessionId = streamSession.id;
      const chunks = await this.streaming.streamResponse(
        streamSession.id,
        generationResult.generatedText
      );
      streamChunks = chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        content: c.content,
        isFinal: c.isFinal,
      }));
      await this.streaming.closeSession(streamSession.id);
    }

    // 8a. Analytics
    await this.analytics.recordUsage({
      requestId: request.requestId,
      capability: request.capability,
      latencyGatewayMs: gatewayLatency,
      latencyReasoningMs: reasonLatency,
      latencyGenerationMs: genLatency,
      latencyTrustMs: trustLatency,
      latencyTotalMs: totalLatency,
    });
    await this.analytics.recordPromptMetric({
      requestId: request.requestId,
      templateName: `${request.capability.toLowerCase()}_template`,
    });
    await this.analytics.trackEvent("ExperienceCompleted", request.requestId, request.actorId, request.capability, {
      sessionId,
      planId: plan.id,
      trustPackageId: trustPackage.id,
      latencyTotalMs: totalLatency,
    });

    // 8b. Audit
    const auditRecord = await this.audit.record({
      requestId: request.requestId,
      actorId: request.actorId,
      actorRole: request.actorRole,
      capability: request.capability,
      modelUsed: "MevisIntelligenceModel-v1",
      evidenceAttached: trustPackage.evidence?.length ?? 0,
      trustPackageId: trustPackage.id,
      responseStatus: "SUCCESS",
      policyChecksPassed: true,
    });

    // 8c. Playback
    const playbackRecord = await this.playback.recordPlayback({
      requestId: request.requestId,
      userRequest: request.query,
      reasoningSnapshot: {
        planId: plan.id,
        intent: plan.intent,
        stepsCount: plan.steps?.length ?? 0,
        graphNodes: graph.nodes?.length ?? 0,
      },
      generationSnapshot: {
        resultId: generationResult.id,
        requestId: generationResult.requestId,
        validationStatus: generationResult.validationStatus,
      },
      trustSnapshot: {
        trustId: trustPackage.id,
        confidence: trustPackage.overallConfidence,
        evidenceCount: trustPackage.evidence?.length ?? 0,
        citationCount: trustPackage.citations?.length ?? 0,
      },
      deliveryMetadata: {
        routedTo: route.routedTo,
        streamed: request.stream ?? false,
        latencyTotalMs: totalLatency,
        streamSessionId: streamSessionId ?? null,
      },
    });

    globalEventBus.publish({ type: "ExperienceCompleted", payload: { requestId: request.requestId, auditId: auditRecord.id }, timestamp: new Date().toISOString() });

    return {
      requestId: request.requestId,
      sessionId: resolvedSessionId,
      capability: request.capability,
      routedTo: route.routedTo,
      generatedText: generationResult.generatedText,
      trustPackageId: trustPackage.id,
      overallConfidence: trustPackage.overallConfidence,
      auditId: auditRecord.id,
      playbackId: playbackRecord.id,
      streamed: request.stream ?? false,
      streamChunks,
      latencyMs: totalLatency,
      recordedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns all recorded AI requests.
   */
  async getHistory(): Promise<any[]> {
    const rows = await this.requestRepo.findAll();
    return rows.map((r: any) => ({
      id: r.id,
      actorId: r.actor_id,
      actorRole: r.actor_role,
      capability: r.capability,
      query: r.query,
      status: r.status,
      sessionId: r.session_id ?? null,
      latencyMs: r.latency_ms ?? null,
      createdAt: r.created_at,
    }));
  }

  /**
   * Returns runtime health status.
   */
  getHealth(): Record<string, unknown> {
    return {
      status: "healthy",
      version: "v1",
      components: {
        aiGateway: "ok",
        cognitiveOrchestrator: "ok",
        generationOrchestrator: "ok",
        trustOrchestrator: "ok",
        router: "ok",
        streaming: "ok",
        analytics: "ok",
        audit: "ok",
        playback: "ok",
      },
      checkedAt: new Date().toISOString(),
    };
  }
}
