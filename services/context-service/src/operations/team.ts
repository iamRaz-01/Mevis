import { type Team } from "./context";

export class TeamAggregate {
  validate(t: Partial<Team>): void {
    if (!t.name) throw new Error("Team name is required.");
    if (!t.organizationId) throw new Error("Team must be assigned to an organization.");
  }
}
