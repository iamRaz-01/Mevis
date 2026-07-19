import { type ConversationMessage } from "./context";
import crypto from "node:crypto";

export class CollaborationEngine {
  constructor(private readonly messageRepo: any) {}

  async postMessage(contextType: string, contextId: string, sender: string, messageText: string): Promise<ConversationMessage> {
    if (!contextId) throw new Error("Context ID is required.");
    if (!messageText) throw new Error("Message text cannot be empty.");

    const id = `msg_${crypto.randomUUID().slice(0, 8)}`;
    const timestamp = new Date().toISOString();
    const msg: ConversationMessage = {
      id,
      contextType,
      contextId,
      sender,
      message: messageText,
      timestamp,
    };

    await this.messageRepo.save({
      id: msg.id,
      context_type: msg.contextType,
      context_id: msg.contextId,
      sender: msg.sender,
      message: msg.message,
      timestamp: msg.timestamp,
    });

    return msg;
  }

  async getMessagesByContext(contextType: string, contextId: string): Promise<ConversationMessage[]> {
    const all = await this.messageRepo.findAll();
    const filtered = all
      .filter((r: any) => r.context_type === contextType && r.context_id === contextId)
      .map((row: any) => ({
        id: row.id,
        contextType: row.context_type,
        contextId: row.context_id,
        sender: row.sender,
        message: row.message,
        timestamp: row.timestamp,
      }));
    
    return filtered.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));
  }
}
