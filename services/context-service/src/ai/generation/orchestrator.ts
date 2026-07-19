import { type GenerationRequest, type GenerationResult, type ModelInvocation } from "./context";
import { type CapabilityResolver } from "./capability-resolver";
import { type ModelRouter } from "./model-router";
import { type PromptComposer } from "./prompt-composer";
import { type InferenceEngine } from "./inference-engine";
import { type ResponseValidator } from "./response-validator";
import { type ResponseFormatter } from "./formatter";
import { globalEventBus } from "../../world/event-bus";
import crypto from "node:crypto";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("GenerationOrchestrator");

export class GenerationOrchestrator {
  constructor(
    public readonly resolver: CapabilityResolver,
    public readonly router: ModelRouter,
    public readonly promptComposer: PromptComposer,
    public readonly inference: InferenceEngine,
    public readonly validator: ResponseValidator,
    public readonly formatter: ResponseFormatter,
    private readonly requestRepo: any,
    private readonly resultRepo: any,
    private readonly invocationRepo: any,
    private readonly planRepo: any,
    private readonly stepRepo: any
  ) {}

  async generate(planId: string, formatType = "Markdown"): Promise<GenerationResult> {
    const rawPlan = await this.planRepo.findById(planId);
    if (!rawPlan) throw new Error(`Reasoning Plan "${planId}" not found.`);

    const allSteps = await this.stepRepo.findAll();
    const steps = allSteps.filter((s: any) => s.plan_id === planId);
    const plan = { ...rawPlan, steps };

    globalEventBus.publish({
      type: "GenerationStarted",
      payload: { planId },
      timestamp: new Date().toISOString(),
    });

    const capability = this.resolver.resolveCapability(plan.intent);

    const requestId = `req_${crypto.randomUUID().slice(0, 8)}`;
    const request: GenerationRequest = {
      id: requestId,
      planId,
      capability,
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };

    const model = this.router.routeModel(capability);
    globalEventBus.publish({
      type: "ModelSelected",
      payload: { requestId, modelId: model.id },
      timestamp: new Date().toISOString(),
    });

    const prompt = this.promptComposer.composePrompt(plan);
    globalEventBus.publish({
      type: "PromptComposed",
      payload: { requestId },
      timestamp: new Date().toISOString(),
    });

    const modelOutput = await this.inference.invokeModel(model.name, prompt);
    globalEventBus.publish({
      type: "InferenceCompleted",
      payload: { requestId, latency: modelOutput.latency },
      timestamp: new Date().toISOString(),
    });

    const validation = this.validator.validateResponse(modelOutput.text);
    const validationStatus = validation.isValid ? "VALID" : "INVALID";
    globalEventBus.publish({
      type: "ResponseValidated",
      payload: { requestId, validationStatus },
      timestamp: new Date().toISOString(),
    });

    if (!validation.isValid) {
      throw new Error(`Generated response validation failed: ${validation.reason}`);
    }

    const formattedText = this.formatter.format(modelOutput.text, formatType);

    const resultId = `res_${crypto.randomUUID().slice(0, 8)}`;
    const result: GenerationResult = {
      id: resultId,
      requestId,
      generatedText: formattedText,
      validationStatus,
      createdAt: new Date().toISOString(),
    };

    await this.requestRepo.save({
      id: request.id,
      plan_id: request.planId,
      capability: request.capability,
      status: request.status,
      created_at: request.createdAt,
    });

    await this.resultRepo.save({
      id: result.id,
      request_id: result.requestId,
      generated_text: result.generatedText,
      validation_status: result.validationStatus,
      created_at: result.createdAt,
    });

    await this.invocationRepo.save({
      id: `inv_${crypto.randomUUID().slice(0, 8)}`,
      request_id: requestId,
      model_name: model.name,
      prompt_sent: prompt,
      tokens_used: modelOutput.tokens,
      latency_ms: modelOutput.latency,
    });

    globalEventBus.publish({
      type: "GenerationCompleted",
      payload: { requestId, resultId },
      timestamp: new Date().toISOString(),
    });

    logger.info(`Generated result "${resultId}" for plan "${planId}".`);
    return result;
  }
}
