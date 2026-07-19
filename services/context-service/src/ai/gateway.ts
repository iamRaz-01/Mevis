import { type PromptPackage } from "./context";
import { type SessionManager } from "./session-manager";
import { type IdentityResolver } from "./identity-resolver";
import { type ConversationManager } from "./conversation-manager";
import { type MemoryManager } from "./memory-manager";
import { type PromptOrchestrator } from "./prompt-orchestrator";
import { type PersonaRegistry } from "./persona-registry";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("AiGateway");

export class AiGateway {
  constructor(
    public readonly sessions: SessionManager,
    public readonly identity: IdentityResolver,
    public readonly conversations: ConversationManager,
    public readonly memories: MemoryManager,
    public readonly prompts: PromptOrchestrator,
    public readonly personas: PersonaRegistry
  ) {}

  async initializeSession(userId: string, activeIncidentId?: string, activeVenueId?: string): Promise<any> {
    const ident = await this.identity.resolveIdentity(userId);
    const session = await this.sessions.createSession(ident.userId, ident.role, activeIncidentId, activeVenueId);

    const conversation = await this.conversations.createConversation(session.id, "Default Assistant Dialogue");

    globalEventBus.publish({
      type: "AISessionCreated",
      payload: { sessionId: session.id, userId: session.userId, role: session.role },
      timestamp: new Date().toISOString(),
    });

    globalEventBus.publish({
      type: "ConversationStarted",
      payload: { conversationId: conversation.id, sessionId: session.id },
      timestamp: new Date().toISOString(),
    });

    return { session, conversation };
  }

  async processChat(
    sessionId: string,
    conversationId: string,
    personaId: string,
    messageContent: string
  ): Promise<PromptPackage> {
    const session = await this.sessions.getSession(sessionId);
    if (!session) throw new Error(`AI Session "${sessionId}" not found.`);

    const persona = this.personas.getPersona(personaId);
    if (!persona) throw new Error(`AI Persona "${personaId}" not found.`);

    globalEventBus.publish({
      type: "MessageReceived",
      payload: { sessionId, conversationId, role: "USER", content: messageContent },
      timestamp: new Date().toISOString(),
    });

    await this.conversations.addMessage(conversationId, "USER", messageContent);

    const memoriesList = await this.memories.getUserMemories(session.userId);

    const history = await this.conversations.getConversationMessages(conversationId);

    const promptPkg = await this.prompts.assemblePrompt(messageContent, session, persona, memoriesList, history);

    globalEventBus.publish({
      type: "PromptPrepared",
      payload: { sessionId, conversationId, systemLength: promptPkg.systemPrompt.length },
      timestamp: new Date().toISOString(),
    });

    logger.info(`Compiled prompt package for session "${sessionId}", user query: "${messageContent}".`);
    return promptPkg;
  }
}
