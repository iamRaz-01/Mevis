import { type WorldRelationship } from "./context";
import crypto from "node:crypto";

export class RelationshipEngine {
  createRelationship(
    sourceEntityId: string,
    targetEntityId: string,
    relationshipType: string,
    metadata: Record<string, any> = {}
  ): WorldRelationship {
    if (!sourceEntityId || !targetEntityId) {
      throw new Error("Source and target entity identifiers must be provided.");
    }
    if (!relationshipType.trim()) {
      throw new Error("Relationship type must be a valid non-empty string.");
    }

    return {
      id: `world:rel:${crypto.randomUUID()}`,
      sourceEntityId,
      targetEntityId,
      relationshipType: relationshipType.toUpperCase().trim(),
      metadata,
    };
  }
}
