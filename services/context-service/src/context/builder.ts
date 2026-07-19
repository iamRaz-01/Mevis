import { type ContextAssemblyContext } from "./context";

export interface ContextSourceReaderPort {
  loadWorldEntities(): Promise<readonly any[]>;
  loadLatestStates(): Promise<readonly any[]>;
}

export class ContextBuilder {
  constructor(private readonly sourceReader: ContextSourceReaderPort) {}

  async assemble(): Promise<ContextAssemblyContext> {
    const rawEntities = await this.sourceReader.loadWorldEntities();
    const rawStates = await this.sourceReader.loadLatestStates();

    const worldEntities: Record<string, any> = {};
    for (const ent of rawEntities) {
      let parsedJson: any = {};
      try {
        parsedJson = JSON.parse(ent.metadata_json);
      } catch {}
      worldEntities[ent.id] = {
        id: ent.id,
        entityType: ent.entity_type,
        displayName: ent.display_name,
        parentEntityId: ent.parent_entity_id,
        identityRef: ent.identity_ref,
        capabilities: parsedJson.capabilities || [],
        timeline: parsedJson.timeline,
        metadata: parsedJson.metadata || {},
      };
    }

    const latestStates: Record<string, any> = {};
    for (const st of rawStates) {
      latestStates[st.entityId] = st;
    }

    // Identify active incidents based on status
    const activeIncidents = Object.values(latestStates).filter((st: any) => {
      const ent = worldEntities[st.entityId];
      return ent && ent.entityType === "Incident Type" && st.stateData.status === "ACTIVE";
    });

    const evidenceReferences: string[] = [];
    for (const st of Object.values(latestStates)) {
      if (st.stateData.evidenceId && typeof st.stateData.evidenceId === "string") {
        evidenceReferences.push(st.stateData.evidenceId);
      }
    }

    return {
      worldEntities,
      latestStates,
      activeIncidents,
      evidenceReferences,
    };
  }
}
