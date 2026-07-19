import { type Feedback } from "./context";
import crypto from "node:crypto";

export class FeedbackEngine {
  constructor(private readonly feedbackRepo: any) {}

  async submitFeedback(trustId: string, userId: string, feedbackType: string, comment?: string): Promise<Feedback> {
    const feedback: Feedback = {
      id: `fb_${crypto.randomUUID().slice(0, 8)}`,
      trustId,
      userId,
      feedbackType,
      comment: comment || null,
      createdAt: new Date().toISOString(),
    };

    await this.feedbackRepo.save({
      id: feedback.id,
      trust_id: feedback.trustId,
      user_id: feedback.userId,
      feedback_type: feedback.feedbackType,
      comment: feedback.comment,
      created_at: feedback.createdAt,
    });

    return feedback;
  }
}
