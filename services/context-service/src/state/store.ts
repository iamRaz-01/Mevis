import { type EntityState } from "./context";

export interface StateStoreRepoPort {
  saveLatestState(state: {
    id: string; // entity_id
    state_data: string;
    last_event_id: string;
    last_event_time: string;
    updated_at: string;
  }): Promise<void>;
  findLatestStateByEntityId(entityId: string): Promise<any>;
  findAllLatestStates(): Promise<readonly any[]>;
  saveHistoryRecord(record: {
    id: string;
    entity_id: string;
    state_data: string;
    event_id: string;
    event_time: string;
    created_at: string;
  }): Promise<void>;
  findHistoryByEntityId(entityId: string): Promise<readonly any[]>;
  hasIngestedEvent(eventId: string): Promise<boolean>;
  saveIngestedEvent(event: {
    id: string;
    entity_id: string;
    event_type: string;
    event_time: string;
    payload_json: string;
    source: string;
    event_version: string;
    created_at: string;
  }): Promise<void>;
}

export class WorldStateStore {
  constructor(private readonly repo: StateStoreRepoPort) {}

  async isDuplicateEvent(eventId: string): Promise<boolean> {
    return await this.repo.hasIngestedEvent(eventId);
  }

  async recordEventIngestion(
    eventId: string,
    entityId: string,
    eventType: string,
    eventTime: string,
    payload: Record<string, any>,
    source: string,
    eventVersion: string
  ): Promise<void> {
    await this.repo.saveIngestedEvent({
      id: eventId,
      entity_id: entityId,
      event_type: eventType,
      event_time: eventTime,
      payload_json: JSON.stringify(payload),
      source,
      event_version: eventVersion,
      created_at: new Date().toISOString(),
    });
  }

  async getLatestState(entityId: string): Promise<EntityState | null> {
    const row = await this.repo.findLatestStateByEntityId(entityId);
    if (!row) return null;
    return {
      entityId: row.id,
      stateData: JSON.parse(row.state_data),
      lastEventId: row.last_event_id,
      lastEventTime: row.last_event_time,
      updatedAt: row.updated_at,
    };
  }

  async saveState(state: EntityState): Promise<void> {
    await this.repo.saveLatestState({
      id: state.entityId,
      state_data: JSON.stringify(state.stateData),
      last_event_id: state.lastEventId,
      last_event_time: state.lastEventTime,
      updated_at: state.updatedAt,
    });
  }

  async saveHistory(
    id: string,
    entityId: string,
    stateData: Record<string, any>,
    eventId: string,
    eventTime: string
  ): Promise<void> {
    await this.repo.saveHistoryRecord({
      id,
      entity_id: entityId,
      state_data: JSON.stringify(stateData),
      event_id: eventId,
      event_time: eventTime,
      created_at: new Date().toISOString(),
    });
  }

  async getHistory(entityId: string): Promise<readonly any[]> {
    const rows = await this.repo.findHistoryByEntityId(entityId);
    return rows.map(r => ({
      id: r.id,
      entityId: r.entity_id,
      stateData: JSON.parse(r.state_data),
      eventId: r.event_id,
      eventTime: r.event_time,
      createdAt: r.created_at,
    }));
  }

  async getAllLatestStates(): Promise<readonly EntityState[]> {
    const rows = await this.repo.findAllLatestStates();
    return rows.map(row => ({
      entityId: row.id,
      stateData: JSON.parse(row.state_data),
      lastEventId: row.last_event_id,
      lastEventTime: row.last_event_time,
      updatedAt: row.updated_at,
    }));
  }
}
