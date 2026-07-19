import { type Organization } from "./context";

export class OrganizationAggregate {
  validate(o: Partial<Organization>): void {
    if (!o.name) throw new Error("Organization name is required.");
  }
}
