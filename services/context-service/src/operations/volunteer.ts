import { type Volunteer } from "./context";

export class VolunteerAggregate {
  validate(v: Partial<Volunteer>): void {
    if (!v.name) throw new Error("Volunteer name is required.");
    if (!v.email || !v.email.includes("@")) throw new Error("Valid volunteer email is required.");
    if (!v.organizationId) throw new Error("Volunteer must be assigned to an organization.");
  }
}
