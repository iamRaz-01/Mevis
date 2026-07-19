export interface RawStep {
  readonly description: string;
  readonly targetEngine: string;
}

export class TaskPlanner {
  planTasks(intentType: string): RawStep[] {
    switch (intentType) {
      case "NAVIGATION":
        return [
          { description: "Retrieve active venue and gates topology.", targetEngine: "DIGITAL_TWIN" },
          { description: "Identify nearby landmarks and routes configuration.", targetEngine: "KNOWLEDGE_BASE" },
          { description: "Retrieve user's current spatial coordinates.", targetEngine: "DIGITAL_TWIN" },
        ];
      case "VOLUNTEER_LOOKUP":
        return [
          { description: "Search volunteer profiles directory.", targetEngine: "OPERATIONAL_DB" },
          { description: "Retrieve active assignment status.", targetEngine: "OPERATIONAL_DB" },
          { description: "Check current checked-in status.", targetEngine: "DIGITAL_TWIN" },
        ];
      case "REPORT_GENERATION":
        return [
          { description: "Retrieve active incident statistics logs.", targetEngine: "OPERATIONAL_DB" },
          { description: "Retrieve average resolution timeline metrics.", targetEngine: "OPERATIONAL_DB" },
          { description: "Retrieve standard emergency SOP templates.", targetEngine: "KNOWLEDGE_BASE" },
        ];
      default:
        return [
          { description: "Retrieve relevant operational database fields.", targetEngine: "OPERATIONAL_DB" },
          { description: "Retrieve standard procedure regulations.", targetEngine: "KNOWLEDGE_BASE" },
        ];
    }
  }
}
