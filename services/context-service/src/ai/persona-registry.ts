import { type AiPersona } from "./context";

export class PersonaRegistry {
  private readonly personas: Map<string, AiPersona> = new Map();

  constructor() {
    this.registerPersona({
      id: "volunteer_assistant",
      name: "Volunteer Assistant",
      tone: "helpful, concise, warm",
      capabilities: ["view_tasks", "check_in_out", "view_announcements"],
      responseConstraints: "Do not display confidential event coordinator alerts.",
    });

    this.registerPersona({
      id: "coordinator_copilot",
      name: "Coordinator Copilot",
      tone: "professional, structured, proactive",
      capabilities: ["assign_tasks", "view_incidents", "view_volunteers"],
      responseConstraints: "Ensure all recommendations require coordinator verification.",
    });

    this.registerPersona({
      id: "operations_assistant",
      name: "Operations Assistant",
      tone: "direct, analytic, precise",
      capabilities: ["view_analytics", "escalate_incidents", "view_audit_trail"],
      responseConstraints: "Adhere to incident escalation SLAs.",
    });
  }

  registerPersona(persona: AiPersona): void {
    this.personas.set(persona.id, persona);
  }

  getPersona(id: string): AiPersona | null {
    return this.personas.get(id) || null;
  }

  listPersonas(): AiPersona[] {
    return Array.from(this.personas.values());
  }
}
