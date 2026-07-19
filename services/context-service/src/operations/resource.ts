import { type Resource } from "./context";

export class ResourceAggregate {
  validate(r: Partial<Resource>): void {
    if (!r.name) throw new Error("Resource name is required.");
    if (!r.category) throw new Error("Resource category is required.");
    if (!r.serialNumber) throw new Error("Resource serial number is required.");
  }
}
