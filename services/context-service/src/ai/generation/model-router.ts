import { type ModelDescriptor } from "./context";

export class ModelRouter {
  private readonly models: ModelDescriptor[] = [
    { id: "fast-conv-model", name: "Fast Conversational Model", provider: "Gemini Pro Flash", type: "Chat" },
    { id: "long-reasoning-model", name: "Long-Context Reasoning Model", provider: "Gemini Ultra", type: "Reasoning" },
    { id: "summarization-optimized", name: "Summarization-Optimized Model", provider: "Gemini Flash Lite", type: "Summary" },
  ];

  routeModel(capability: string): ModelDescriptor {
    if (capability === "ReportGeneration") {
      return this.models[1];
    } else if (capability === "OperationalSummary") {
      return this.models[2];
    }
    return this.models[0];
  }

  listModels(): ModelDescriptor[] {
    return this.models;
  }
}
