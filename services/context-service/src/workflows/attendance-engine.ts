import { type AttendanceRecord } from "./context";

export class AttendanceEngine {
  validateCheckIn(volunteerId: string, currentRecords: AttendanceRecord[]): void {
    const active = currentRecords.filter((r) => r.volunteerId === volunteerId && r.status === "CHECKED_IN");
    if (active.length > 0) {
      throw new Error(`Volunteer "${volunteerId}" is already checked in.`);
    }
  }

  validateCheckOut(volunteerId: string, currentRecords: AttendanceRecord[]): void {
    const active = currentRecords.filter((r) => r.volunteerId === volunteerId && r.status === "CHECKED_IN");
    if (active.length === 0) {
      throw new Error(`Volunteer "${volunteerId}" cannot check out without checking in first.`);
    }
  }
}
