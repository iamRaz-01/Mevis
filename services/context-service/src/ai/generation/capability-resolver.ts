export class CapabilityResolver {
  resolveCapability(intentType: string): string {
    switch (intentType) {
      case "NAVIGATION":
        return "VolunteerAssistant";
      case "VOLUNTEER_LOOKUP":
        return "VolunteerAssistant";
      case "REPORT_GENERATION":
        return "ReportGeneration";
      default:
        return "OperationalSummary";
    }
  }

  listCapabilities(): string[] {
    return ["VolunteerAssistant", "CoordinatorCopilot", "ReportGeneration", "OperationalSummary"];
  }
}
