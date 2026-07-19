import { type Alternative } from "./context";
import crypto from "node:crypto";

export class OptionGenerator {
  generateOptions(decisionType: string): ReadonlyArray<Alternative> {
    const list: Alternative[] = [];

    if (decisionType === "Medical Response") {
      list.push({
        id: `alt_${crypto.randomUUID()}`,
        description: "Dispatch nearest available medical volunteer to victim location.",
        requiredResources: ["Medical Volunteer (proximity nearby)"],
        estimatedDurationMinutes: 4,
        supportingEvidence: ["ev_med_first_aid"],
      });
      list.push({
        id: `alt_${crypto.randomUUID()}`,
        description: "Wait for ambulance arrival.",
        requiredResources: ["Emergency Ambulance vehicle"],
        estimatedDurationMinutes: 6,
        supportingEvidence: ["ev_med_responder_slas"],
      });
      list.push({
        id: `alt_${crypto.randomUUID()}`,
        description: "Escalate emergency level to venue medical director.",
        requiredResources: ["Venue Medical Director"],
        estimatedDurationMinutes: 10,
        supportingEvidence: [],
      });
    } else {
      list.push({
        id: `alt_${crypto.randomUUID()}`,
        description: "Deploy standard emergency response operations procedures.",
        requiredResources: ["Stand volunteers"],
        estimatedDurationMinutes: 15,
        supportingEvidence: ["ev_gen_operations"],
      });
    }

    return list;
  }
}
