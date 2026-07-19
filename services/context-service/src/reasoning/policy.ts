import { type PolicyRecord } from "./context";

export class PolicyCollector {
  collectPolicies(decisionType: string): ReadonlyArray<PolicyRecord> {
    const list: PolicyRecord[] = [];

    if (decisionType === "Medical Response") {
      list.push({
        id: "pol_med_dispatch",
        category: "Safety Protocols",
        content: "Always dispatch the nearest certified medical volunteer first.",
        mandatory: true,
      });
      list.push({
        id: "pol_med_shift_limits",
        category: "Staff Management",
        content: "Responders must not exceed 8-hour shifts without a mandatory break.",
        mandatory: false,
      });
    } else if (decisionType === "Evacuation") {
      list.push({
        id: "pol_evac_triggers",
        category: "Crisis Management",
        content: "Evacuation routes must remain clear of all blockages or crowd barriers.",
        mandatory: true,
      });
    } else {
      list.push({
        id: "pol_gen_safety",
        category: "Operational Standards",
        content: "Adhere to the general stadium operations guidelines at all times.",
        mandatory: true,
      });
    }

    return list;
  }
}
