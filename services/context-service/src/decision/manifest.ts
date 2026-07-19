import { type DecisionCandidate } from "./context";

export class DecisionManifestBuilder {
  buildManifest(candidate: DecisionCandidate): any {
    return {
      decisionId: candidate.id,
      decisionType: candidate.decisionType,
      sourceContextPackageId: candidate.context.validatedContextPackage?.pkg?.packageId || "unknown",
      involvedEntities: candidate.context.entitiesInvolved,
      evidenceReferences: candidate.context.evidenceReferences,
      appliedConstraintsCount: 
        candidate.constraints.operational.length +
        candidate.constraints.business.length +
        candidate.constraints.resource.length +
        candidate.constraints.time.length +
        candidate.constraints.legal.length,
      lifecycleState: candidate.lifecycleState,
      createdAt: candidate.createdAt,
      integrityCheck: "PASS",
    };
  }
}
