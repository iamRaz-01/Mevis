import { type DigitalTwinRegistry } from "./registry";

export class TwinQueryEngine {
  constructor(private readonly registry: DigitalTwinRegistry) {}

  queryNearestMedicalVolunteers(incidentCoords: readonly [number, number], limit: number = 3): readonly any[] {
    const twin = this.registry.getTwinContext();
    if (!twin) return [];

    const volunteers: any[] = [];
    for (const ent of Object.values(twin.entities)) {
      if (ent.entityType === "Volunteer" && ent.latestState) {
        const coords = ent.latestState.attributes?.locationCoords;
        const capabilities = ent.metadata?.capabilities || [];
        const isMedical = capabilities.includes("MEDICAL") || ent.displayName.toLowerCase().includes("medical");
        
        if (coords && Array.isArray(coords) && coords.length === 2 && isMedical) {
          const dx = coords[0] - incidentCoords[0];
          const dy = coords[1] - incidentCoords[1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          volunteers.push({
            id: ent.id,
            displayName: ent.displayName,
            location: ent.latestState.attributes?.location || "Unknown",
            distance: dist,
          });
        }
      }
    }

    return volunteers.sort((a, b) => a.distance - b.distance).slice(0, limit);
  }

  queryCurrentIncidents(): readonly any[] {
    const twin = this.registry.getTwinContext();
    if (!twin) return [];

    const incidents: any[] = [];
    for (const ent of Object.values(twin.entities)) {
      if (ent.entityType === "Incident Type" && ent.latestState) {
        incidents.push({
          id: ent.id,
          displayName: ent.displayName,
          severity: ent.latestState.attributes?.severity || "MEDIUM",
          status: ent.latestState.attributes?.status || "ACTIVE",
          location: ent.latestState.attributes?.location || "Unknown",
        });
      }
    }
    return incidents;
  }

  queryOpenEvacuationRoutes(): readonly any[] {
    const twin = this.registry.getTwinContext();
    if (!twin) return [];

    const routes: any[] = [];
    for (const rel of twin.relationships) {
      if (rel.relationshipType === "CONNECTED_TO" && rel.metadata?.routeType === "EVACUATION") {
        routes.push({
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          status: rel.metadata?.status || "OPEN",
        });
      }
    }
    return routes;
  }
}
