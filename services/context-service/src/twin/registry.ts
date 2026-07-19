import { type DigitalTwinContext } from "./context";

export class DigitalTwinRegistry {
  private currentContext: DigitalTwinContext | null = null;

  setTwinContext(ctx: DigitalTwinContext): void {
    this.currentContext = ctx;
  }

  getTwinContext(): DigitalTwinContext | null {
    return this.currentContext;
  }
}
