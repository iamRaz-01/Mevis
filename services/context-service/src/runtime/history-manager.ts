import { type TimelineEntry } from "./context";

export class HistoryManager {
  constructor(private readonly repo: any) {}

  async getTimeline(decisionId: string): Promise<ReadonlyArray<TimelineEntry>> {
    const row = await this.repo.findById(decisionId);
    if (!row) return [];
    return row.timeline_json ? JSON.parse(row.timeline_json) : [];
  }
}
