import { type Broadcast } from "./context";
import crypto from "node:crypto";

export class BroadcastEngine {
  constructor(private readonly broadcastRepo: any) {}

  async publishBroadcast(title: string, body: string, priority: string, audience: string): Promise<Broadcast> {
    const id = `bc_${crypto.randomUUID().slice(0, 8)}`;
    const timestamp = new Date().toISOString();
    const broadcast: Broadcast = {
      id,
      title,
      body,
      priority,
      audience,
      timestamp,
    };

    await this.broadcastRepo.save({
      id: broadcast.id,
      title: broadcast.title,
      body: broadcast.body,
      priority: broadcast.priority,
      audience: broadcast.audience,
      timestamp: broadcast.timestamp,
    });

    return broadcast;
  }
}
