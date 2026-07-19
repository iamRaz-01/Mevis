import { type PrioritizedFact, type ContextRelationship } from "./context";

export class CompressionEngine {
  compress(
    facts: readonly PrioritizedFact[],
    relationships: readonly ContextRelationship[],
    limit: number = 5
  ): { readonly compressedFacts: readonly PrioritizedFact[]; readonly compressedRelationships: readonly ContextRelationship[] } {
    const compressedFacts = facts.slice(0, limit);
    const retainedEntityIds = new Set(compressedFacts.map(f => f.entityId));

    const compressedRelationships = relationships.filter(
      r => retainedEntityIds.has(r.sourceId) && retainedEntityIds.has(r.targetId)
    );

    return {
      compressedFacts,
      compressedRelationships,
    };
  }
}
