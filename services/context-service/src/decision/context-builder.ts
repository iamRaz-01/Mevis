import { type DecisionContext } from "./context";
import { type DigitalTwinContext } from "../twin/context";

export class DecisionContextBuilder {
  buildDecisionContext(twin: DigitalTwinContext): DecisionContext {
    const pkg = twin.validatedContext?.pkg;
    const evidenceReferences = pkg?.evidenceReferences || [];
    
    const entitiesInvolved = Object.keys(twin.entities);
    const activeSituations = twin.activeSituations;
    const timeline = {
      eventTime: twin.timeline.currentEventTime,
      compiledTime: pkg?.timeline?.compiledTime || new Date().toISOString(),
    };

    return {
      twinSnapshot: twin,
      validatedContextPackage: twin.validatedContext,
      evidenceReferences,
      knowledgeRef: "guidelines/standard-operating-procedures.md",
      entitiesInvolved,
      activeSituations,
      timeline,
      metadata: {
        twinSynchronizedTime: twin.timeline.synchronizedTime,
        provenance: twin.provenance,
      },
    };
  }
}
