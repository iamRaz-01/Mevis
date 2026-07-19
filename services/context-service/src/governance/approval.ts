export class ApprovalRoutingEngine {
  assignApprovalRoute(decisionType: string): readonly string[] {
    if (decisionType === "Medical Response") {
      return ["Medical Commander", "Operations Commander"];
    } else if (decisionType === "Evacuation") {
      return ["Security Commander", "Operations Commander"];
    } else {
      return ["Volunteer Coordinator"];
    }
  }
}
