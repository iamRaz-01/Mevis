import { type ProcessingJob, type DocumentVersion, type JobRepositoryPort, type StoragePort, KnowledgeProcessingOrchestrator } from "./orchestrator";
import { type KnowledgeProcessingConfig, defaultPipelineConfig } from "./context";
import { globalEventBus } from "./event-bus";
import { metrics } from "@mevis/platform-operations";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("KnowledgeProcessingWorker");

export interface DocumentVersionRepoPort {
  getVersionById(id: string): Promise<DocumentVersion | null>;
}

export interface ProcessingJobRepoPort extends JobRepositoryPort {
  getNextQueuedJob(): Promise<ProcessingJob | null>;
}

export class KnowledgeProcessingWorker {
  private running = false;
  private pollTimeout?: NodeJS.Timeout;
  private currentPromise?: Promise<void>;

  constructor(
    private readonly jobRepo: ProcessingJobRepoPort,
    private readonly versionRepo: DocumentVersionRepoPort,
    private readonly orchestrator: KnowledgeProcessingOrchestrator,
    private readonly pollIntervalMs: number = 2000
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("Knowledge Processing Worker started.");
    this.poll();
  }

  stop(): void {
    this.running = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = undefined;
    }
    logger.info("Knowledge Processing Worker stopped.");
  }

  private poll(): void {
    if (!this.running) return;

    this.currentPromise = (async () => {
      try {
        await this.processNext();
      } catch (err: any) {
        logger.error("Error in background job worker process:", { error: err?.message || String(err) });
      }
    })().finally(() => {
      if (this.running) {
        this.pollTimeout = setTimeout(() => this.poll(), this.pollIntervalMs);
      }
    });
  }

  async processNext(): Promise<boolean> {
    metrics.gauge("pipeline_worker_active").set(this.running ? 1 : 0);
    
    // Fetch one queued job
    const job = await this.jobRepo.getNextQueuedJob();
    if (!job) {
      return false; // No queued jobs found
    }

    metrics.counter("pipeline_jobs_received_total").increment();
    logger.info(`Fetched queued job ${job.id} for document ${job.documentId}`);

    const version = await this.versionRepo.getVersionById(job.versionId);
    if (!version) {
      const errMsg = `Document version ${job.versionId} not found in database registry.`;
      logger.error(errMsg, { error: errMsg });
      await this.jobRepo.updateJobStatus(job.id, "Failed", errMsg);
      
      await globalEventBus.publish({
        type: "ProcessingFailed",
        timestamp: new Date().toISOString(),
        payload: { jobId: job.id, assetId: job.assetId, error: errMsg },
      });
      return true;
    }

    await globalEventBus.publish({
      type: "ProcessingStarted",
      timestamp: new Date().toISOString(),
      payload: { jobId: job.id, assetId: job.assetId, documentId: job.documentId, versionId: job.versionId },
    });

    const jobTimer = metrics.timer().start();

    try {
      // Execute the orchestrator sequentially across stages
      await this.orchestrator.orchestrate(job, version);

      const durationMs = jobTimer();
      metrics.counter("pipeline_jobs_success_total").increment();
      metrics.histogram("pipeline_job_duration_ms").record(durationMs);

      await globalEventBus.publish({
        type: "ProcessingCompleted",
        timestamp: new Date().toISOString(),
        payload: { jobId: job.id, assetId: job.assetId, documentId: job.documentId, versionId: job.versionId, durationMs },
      });
    } catch (err: any) {
      const durationMs = jobTimer();
      metrics.counter("pipeline_jobs_failure_total").increment();
      
      const errMsg = err?.message || String(err);

      await globalEventBus.publish({
        type: "ProcessingFailed",
        timestamp: new Date().toISOString(),
        payload: { jobId: job.id, assetId: job.assetId, error: errMsg, durationMs },
      });
    }

    return true;
  }

  // A helper to await active processing promise block before stop returns (for unit testing stability)
  async awaitActiveProcessing(): Promise<void> {
    if (this.currentPromise) {
      await this.currentPromise;
    }
  }
}
