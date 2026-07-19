export class PersonalizationEngine {
  personalizePresentation(text: string, role: string): string {
    if (role === "ROLE_USER") {
      return `Personalized Volunteer Action: ${text}`;
    }
    if (role === "ROLE_COORDINATOR") {
      return `Coordinator Advisory: ${text}`;
    }
    return text;
  }

  getProfileMetadata(role: string): any {
    return {
      role,
      detailLevel: role === "ROLE_ADMIN" ? "Detailed" : "Standard",
      terminology: "Operational",
    };
  }
}
