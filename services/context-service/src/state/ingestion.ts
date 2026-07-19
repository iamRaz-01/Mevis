import { type NormalizedEvent } from "./context";

export class EventIngestion {
  normalize(event: any): NormalizedEvent {
    if (!event.id || typeof event.id !== "string") {
      throw new Error("Validation failure: event 'id' must be a valid string.");
    }
    if (!event.entityId || typeof event.entityId !== "string") {
      throw new Error("Validation failure: target 'entityId' must be a valid string.");
    }
    if (!event.eventType || typeof event.eventType !== "string") {
      throw new Error("Validation failure: 'eventType' must be a valid string.");
    }
    if (!event.timestamp || isNaN(Date.parse(event.timestamp))) {
      throw new Error(`Validation failure: 'timestamp' value "${event.timestamp}" is malformed.`);
    }
    if (!event.payload || typeof event.payload !== "object") {
      throw new Error("Validation failure: event 'payload' must be a valid object.");
    }

    return {
      eventId: event.id,
      entityId: event.entityId,
      eventType: event.eventType,
      eventTime: new Date(event.timestamp).toISOString(),
      payload: event.payload,
      source: event.source || "External",
      version: event.version || "1.0.0",
    };
  }
}
