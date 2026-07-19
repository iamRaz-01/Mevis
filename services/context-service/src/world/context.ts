export interface TimelineConfig {
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly scheduledTimes: readonly string[];
}

export interface WorldEntity {
  readonly id: string; // globally unique world identifier, e.g., world:entity:<uuid>
  readonly entityType: string;
  readonly displayName: string;
  readonly parentEntityId: string | null;
  readonly identityRef: string | null;
  readonly capabilities: readonly string[];
  readonly timeline: TimelineConfig;
  readonly metadata: Record<string, any>;
}

export interface WorldRelationship {
  readonly id: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly relationshipType: string;
  readonly metadata: Record<string, any>;
}

export interface WorldManifest {
  readonly entitiesCreated: number;
  readonly relationshipCount: number;
  readonly hierarchyDepth: number;
  readonly entityTypes: Record<string, number>;
  readonly integrityPassed: boolean;
  readonly createdAt: string;
}

export interface WorldContext {
  readonly entities: Record<string, WorldEntity>;
  readonly relationships: Record<string, WorldRelationship>;
}
