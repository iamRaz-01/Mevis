export interface EngagedResourceCheckPort {
  loadEngagedResources(): Promise<readonly string[]>;
}

export class ConflictDetectionEngine {
  constructor(private readonly resourceChecker: EngagedResourceCheckPort) {}

  async detectConflicts(pkg: any): Promise<readonly string[]> {
    const conflicts: string[] = [];
    const engaged = await this.resourceChecker.loadEngagedResources();

    const resourcesNeeded = pkg.primaryRecommendation?.requiredResources || [];
    for (const res of resourcesNeeded) {
      if (engaged.includes(res)) {
        conflicts.push(`Resource conflict: "${res}" is already engaged in active operations.`);
      }
    }

    return conflicts;
  }
}
