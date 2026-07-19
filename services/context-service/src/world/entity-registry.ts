import { type WorldEntity, type TimelineConfig } from "./context";
import crypto from "node:crypto";

export const SUPPORTED_ENTITY_TYPES = new Set([
  "Volunteer",
  "Venue",
  "Gate",
  "Checkpoint",
  "Medical Team",
  "Security Team",
  "Incident Type",
  "Resource",
  "Vehicle",
  "Equipment",
  "Zone",
  "Fan Area"
]);

export class EntityRegistry {
  generateWorldId(): string {
    return `world:entity:${crypto.randomUUID()}`;
  }

  register(
    entityType: string,
    displayName: string,
    parentEntityId: string | null = null,
    identityRef: string | null = null,
    capabilities: readonly string[] = [],
    timeline: TimelineConfig = { validFrom: new Date().toISOString(), validTo: null, scheduledTimes: [] },
    metadata: Record<string, any> = {}
  ): WorldEntity {
    if (!SUPPORTED_ENTITY_TYPES.has(entityType)) {
      throw new Error(`Unsupported world entity type: "${entityType}".`);
    }
    if (!displayName.trim()) {
      throw new Error("Display name must be a non-empty string.");
    }

    return {
      id: this.generateWorldId(),
      entityType,
      displayName,
      parentEntityId,
      identityRef,
      capabilities,
      timeline,
      metadata,
    };
  }
}
