export interface Notification {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly priority: string;
  readonly sourceEvent: string;
  readonly recipient: string;
  readonly timestamp: string;
  readonly deliveryState: string;
  readonly acknowledgedAt: string | null;
}

export interface Broadcast {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly priority: string;
  readonly audience: string;
  readonly timestamp: string;
}

export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly timestamp: string;
}

export interface ConversationMessage {
  readonly id: string;
  readonly contextType: string;
  readonly contextId: string;
  readonly sender: string;
  readonly message: string;
  readonly timestamp: string;
}
