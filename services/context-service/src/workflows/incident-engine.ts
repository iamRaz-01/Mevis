import { type Incident } from "./context";

export class IncidentEngine {
  validateTransition(currentStatus: string, nextStatus: string): void {
    const validMap: Record<string, string[]> = {
      "CREATED": ["REPORTED", "ACKNOWLEDGED"],
      "REPORTED": ["ACKNOWLEDGED"],
      "ACKNOWLEDGED": ["ASSIGNED", "IN_PROGRESS"],
      "ASSIGNED": ["IN_PROGRESS", "RESOLVED"],
      "IN_PROGRESS": ["RESOLVED"],
      "RESOLVED": ["CLOSED"],
      "CLOSED": [],
    };

    const allowed = validMap[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition from "${currentStatus}" to "${nextStatus}".`);
    }
  }

  shouldEscalate(incident: Incident, durationMinutes: number): boolean {
    if (incident.status !== "RESOLVED" && incident.status !== "CLOSED" && durationMinutes >= 30) {
      return true;
    }
    return false;
  }
}
