import { type TimelineEntry } from "./context";
import { globalEventBus } from "../world/event-bus";

export class PlaybackManager {
  async initiatePlayback(decisionId: string, timeline: ReadonlyArray<TimelineEntry>): Promise<ReadonlyArray<TimelineEntry>> {
    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "DecisionPlaybackStarted",
      timestamp,
      payload: { decisionId },
    });

    return timeline;
  }
}
