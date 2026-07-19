import { type WorldEntity } from "./context";

export class HierarchyEngine {
  getParent(entityId: string, entities: Record<string, WorldEntity>): WorldEntity | null {
    const ent = entities[entityId];
    if (!ent || !ent.parentEntityId) return null;
    return entities[ent.parentEntityId] || null;
  }

  getChildren(entityId: string, entities: Record<string, WorldEntity>): readonly WorldEntity[] {
    return Object.values(entities).filter(ent => ent.parentEntityId === entityId);
  }

  getPathToRoot(entityId: string, entities: Record<string, WorldEntity>): readonly WorldEntity[] {
    const path: WorldEntity[] = [];
    let current = entities[entityId];
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current.id)) {
        // Cycle loop prevention
        break;
      }
      path.push(current);
      visited.add(current.id);

      if (current.parentEntityId) {
        current = entities[current.parentEntityId];
      } else {
        break;
      }
    }
    return path;
  }

  getHierarchyDepth(entities: Record<string, WorldEntity>): number {
    let maxDepth = 0;
    for (const ent of Object.values(entities)) {
      const path = this.getPathToRoot(ent.id, entities);
      if (path.length > maxDepth) {
        maxDepth = path.length;
      }
    }
    return maxDepth;
  }
}
