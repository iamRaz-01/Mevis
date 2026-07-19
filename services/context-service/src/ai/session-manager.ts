import { type AiSession } from "./context";
import crypto from "node:crypto";

export class SessionManager {
  constructor(private readonly sessionRepo: any) {}

  async createSession(userId: string, role: string, activeIncidentId?: string, activeVenueId?: string): Promise<AiSession> {
    const id = `sess_${crypto.randomUUID().slice(0, 8)}`;
    const session: AiSession = {
      id,
      userId,
      role,
      activeIncidentId: activeIncidentId || null,
      activeVenueId: activeVenueId || null,
      createdAt: new Date().toISOString(),
    };

    await this.sessionRepo.save({
      id: session.id,
      user_id: session.userId,
      role: session.role,
      active_incident_id: session.activeIncidentId,
      active_venue_id: session.activeVenueId,
      created_at: session.createdAt,
    });

    return session;
  }

  async getSession(id: string): Promise<AiSession | null> {
    const row = await this.sessionRepo.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      role: row.role,
      activeIncidentId: row.active_incident_id,
      activeVenueId: row.active_venue_id,
      createdAt: row.created_at,
    };
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessionRepo.delete(id);
  }
}
