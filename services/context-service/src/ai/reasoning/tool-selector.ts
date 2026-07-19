export interface ToolDescriptor {
  readonly name: string;
  readonly description: string;
  readonly category: string;
}

export class ToolSelector {
  private readonly toolsList: ToolDescriptor[] = [
    { name: "KNOWLEDGE_BASE", description: "Queries SOP guides and PDF documents repositories.", category: "Retrieval" },
    { name: "DIGITAL_TWIN", description: "Queries live physical gate sensors, crowd density, and positions.", category: "Realtime" },
    { name: "OPERATIONAL_DB", description: "Queries incident statuses, task logs, and schedules.", category: "Database" },
    { name: "DECISION_POLICIES", description: "Fetches approved recommendations and governance guidelines.", category: "Governance" },
  ];

  selectTools(intentType: string): ToolDescriptor[] {
    switch (intentType) {
      case "NAVIGATION":
        return [this.toolsList[0], this.toolsList[1]];
      case "VOLUNTEER_LOOKUP":
        return [this.toolsList[1], this.toolsList[2]];
      case "REPORT_GENERATION":
        return [this.toolsList[0], this.toolsList[2]];
      default:
        return [this.toolsList[2], this.toolsList[3]];
    }
  }

  listAllTools(): ToolDescriptor[] {
    return this.toolsList;
  }
}
