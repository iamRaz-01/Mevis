export interface AiSession {
  readonly id: string;
  readonly userId: string;
  readonly role: string;
  readonly activeIncidentId: string | null;
  readonly activeVenueId: string | null;
  readonly createdAt: string;
}

export interface Conversation {
  readonly id: string;
  readonly sessionId: string;
  readonly title: string;
  readonly createdAt: string;
}

export interface ConversationMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly role: string;
  readonly content: string;
  readonly timestamp: string;
}

export interface UserMemory {
  readonly id: string;
  readonly userId: string;
  readonly memoryText: string;
  readonly scope: string;
  readonly createdAt: string;
}

export interface AiPersona {
  readonly id: string;
  readonly name: string;
  readonly tone: string;
  readonly capabilities: string[];
  readonly responseConstraints: string;
}

export interface PromptPackage {
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly context: {
    readonly userId: string;
    readonly role: string;
    readonly activeIncidentId: string | null;
    readonly activeVenueId: string | null;
    readonly operationalStateJson: string;
    readonly memoryFacts: string[];
    readonly chatHistory: { readonly role: string; readonly content: string }[];
  };
}
