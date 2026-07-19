import { type Conversation, type ConversationMessage } from "./context";
import crypto from "node:crypto";

export class ConversationManager {
  constructor(
    private readonly conversationRepo: any,
    private readonly messageRepo: any
  ) {}

  async createConversation(sessionId: string, title: string): Promise<Conversation> {
    const id = `conv_${crypto.randomUUID().slice(0, 8)}`;
    const conversation: Conversation = {
      id,
      sessionId,
      title,
      createdAt: new Date().toISOString(),
    };

    await this.conversationRepo.save({
      id: conversation.id,
      session_id: conversation.sessionId,
      title: conversation.title,
      created_at: conversation.createdAt,
    });

    return conversation;
  }

  async addMessage(conversationId: string, role: string, content: string): Promise<ConversationMessage> {
    const id = `msg_${crypto.randomUUID().slice(0, 8)}`;
    const message: ConversationMessage = {
      id,
      conversationId,
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    await this.messageRepo.save({
      id: message.id,
      conversation_id: message.conversationId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    });

    return message;
  }

  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    const all = await this.messageRepo.findAll();
    const filtered = all
      .filter((m: any) => m.conversation_id === conversationId)
      .map((row: any) => ({
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role,
        content: row.content,
        timestamp: row.timestamp,
      }));

    const sorted = filtered.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));

    return sorted.slice(-15);
  }
}
