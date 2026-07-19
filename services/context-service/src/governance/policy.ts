export class PolicyEngine {
  validatePolicies(pkg: any): { readonly compliant: boolean; readonly violations: readonly string[] } {
    const violations: string[] = [];
    const candidate = pkg.decisionCandidate;

    if (candidate && candidate.decisionType === "Medical Response") {
      const twin = candidate.context?.twinSnapshot;
      if (twin) {
        const hasMedicalVolunteer = Object.values(twin.entities || {}).some(
          (e: any) => e.entityType === "Volunteer" && e.metadata?.capabilities?.includes("MEDICAL")
        );

        if (!hasMedicalVolunteer) {
          violations.push("No available volunteer holds a certified MEDICAL first-aid capability.");
        }
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }
}
