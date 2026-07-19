import { type DecisionConstraints } from "./context";
import { type DigitalTwinContext } from "../twin/context";

export class ConstraintBuilder {
  buildConstraints(twin: DigitalTwinContext): DecisionConstraints {
    const operational: string[] = [];
    const business: string[] = [];
    const resource: string[] = [];
    const time: string[] = [];
    const legal: string[] = [];

    for (const ent of Object.values(twin.entities)) {
      if (ent.entityType === "Incident Type" && ent.latestState) {
        const severity = ent.latestState.attributes?.severity;
        if (severity === "CRITICAL") {
          operational.push("SLA critical escalation response priority mandatory.");
          time.push("Critical incident SLA: response target within 5 minutes.");
        }
      }
    }

    for (const rel of twin.relationships) {
      if (rel.relationshipType === "CONNECTED_TO" && rel.metadata?.status === "BLOCKED") {
        operational.push(`Evacuation path from "${rel.sourceId}" to "${rel.targetId}" is currently BLOCKED.`);
      }
    }

    const availableResponders = Object.values(twin.entities).filter(
      (e: any) => e.entityType === "Volunteer" && e.latestState?.attributes?.status === "AVAILABLE"
    );

    if (availableResponders.length === 0) {
      resource.push("Zero active medical responders currently AVAILABLE.");
    } else {
      resource.push(`Available responders count: ${availableResponders.length}.`);
    }

    business.push("Certifications requirement: responders must hold ACTIVE first-aid licenses.");
    legal.push("Compliance requirement: adhere strictly to standard stadium safety protocols.");

    return {
      operational,
      business,
      resource,
      time,
      legal,
    };
  }
}
