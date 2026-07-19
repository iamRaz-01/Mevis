import { type TimelineConfig } from "./context";

export class TimelineFoundation {
  createTimeline(
    validFrom: string,
    validTo: string | null = null,
    scheduledTimes: readonly string[] = []
  ): TimelineConfig {
    if (isNaN(Date.parse(validFrom))) {
      throw new Error(`Invalid ISO date format for validFrom: "${validFrom}".`);
    }
    if (validTo && isNaN(Date.parse(validTo))) {
      throw new Error(`Invalid ISO date format for validTo: "${validTo}".`);
    }

    return {
      validFrom,
      validTo,
      scheduledTimes,
    };
  }

  isValidAt(timeline: TimelineConfig, timestamp: string): boolean {
    const time = Date.parse(timestamp);
    if (isNaN(time)) return false;

    const from = Date.parse(timeline.validFrom);
    const to = timeline.validTo ? Date.parse(timeline.validTo) : Infinity;

    return time >= from && time <= to;
  }
}
