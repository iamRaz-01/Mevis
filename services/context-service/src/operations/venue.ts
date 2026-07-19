import { type Venue } from "./context";

export class VenueAggregate {
  validate(v: Partial<Venue>): void {
    if (!v.name) throw new Error("Venue name is required.");
  }
}
