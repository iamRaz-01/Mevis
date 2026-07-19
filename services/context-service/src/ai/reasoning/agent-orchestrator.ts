export interface AgentDescriptor {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly capabilities: string[];
}

export class AgentOrchestrator {
  private readonly agentsList: AgentDescriptor[] = [
    { id: "navigation_agent", name: "Navigation Agent", role: "Directions specialist", capabilities: ["route_planning", "gate_lookup"] },
    { id: "incident_agent", name: "Incident Analysis Agent", role: "Critical response planner", capabilities: ["incident_lookup", "escalate"] },
    { id: "reporting_agent", name: "Reporting Agent", role: "Analytics summarizer", capabilities: ["kpi_calculations", "summarize"] },
  ];

  selectAgent(intentType: string): AgentDescriptor {
    switch (intentType) {
      case "NAVIGATION":
        return this.agentsList[0];
      case "VOLUNTEER_LOOKUP":
        return this.agentsList[1];
      case "REPORT_GENERATION":
        return this.agentsList[2];
      default:
        return this.agentsList[1];
    }
  }

  listAllAgents(): AgentDescriptor[] {
    return this.agentsList;
  }
}
