import { type PromptPackage } from "./context";

export class PromptOrchestrator {
  constructor(
    private readonly incidentRepo: any,
    private readonly taskRepo: any
  ) {}

  async assemblePrompt(
    userQuery: string,
    session: any,
    persona: any,
    memories: any[],
    chatHistory: any[]
  ): Promise<PromptPackage> {
    const memoryStrings = memories.map((m) => m.memoryText);

    let activeIncident: any = null;
    if (session.activeIncidentId) {
      activeIncident = await this.incidentRepo.findById(session.activeIncidentId);
    }

    const tasks = await this.taskRepo.findAll();
    const relatedTasks = tasks.filter((t: any) => t.assignee_id === session.userId && t.status !== "COMPLETED");

    const operationalState = {
      activeIncident: activeIncident || "None",
      activeVenueId: session.activeVenueId || "Unassigned",
      assignedTasksCount: relatedTasks.length,
      assignedTasks: relatedTasks.map((t: any) => ({ id: t.id, title: t.title, status: t.status })),
    };

    const systemPrompt = `You are MEVIS Assistant acting as ${persona.name}.
Tone constraints: ${persona.tone}.
Capabilities: ${persona.capabilities.join(", ")}.
Safety response constraints: ${persona.responseConstraints}.
User Role: ${session.role}.
User Context Preferences: ${memoryStrings.join("; ") || "None"}.`;

    const chatHistoryPayload = chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    return {
      systemPrompt,
      userPrompt: userQuery,
      context: {
        userId: session.userId,
        role: session.role,
        activeIncidentId: session.activeIncidentId,
        activeVenueId: session.activeVenueId,
        operationalStateJson: JSON.stringify(operationalState),
        memoryFacts: memoryStrings,
        chatHistory: chatHistoryPayload,
      },
    };
  }
}
