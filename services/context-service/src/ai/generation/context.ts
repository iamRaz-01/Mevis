export interface GenerationRequest {
  readonly id: string;
  readonly planId: string;
  readonly capability: string;
  readonly status: string;
  readonly createdAt: string;
}

export interface GenerationResult {
  readonly id: string;
  readonly requestId: string;
  readonly generatedText: string;
  readonly validationStatus: string;
  readonly createdAt: string;
}

export interface ModelInvocation {
  readonly id: string;
  readonly requestId: string;
  readonly modelName: string;
  readonly promptSent: string;
  readonly tokensUsed: number;
  readonly latencyMs: number;
}

export interface ModelDescriptor {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly type: string;
}
