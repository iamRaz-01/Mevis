import { type Assignment } from "./context";

export class AssignmentEngine {
  validateTransition(currentStatus: string, nextStatus: string): void {
    const validMap: Record<string, string[]> = {
      "CREATED": ["ACCEPTED", "ACTIVE"],
      "ACCEPTED": ["ACTIVE", "COMPLETED"],
      "ACTIVE": ["COMPLETED", "RELEASED"],
      "COMPLETED": ["RELEASED"],
      "RELEASED": [],
    };

    const allowed = validMap[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition from "${currentStatus}" to "${nextStatus}".`);
    }
  }

  validateExclusivity(assigneeId: string, currentAssignments: Assignment[]): void {
    const active = currentAssignments.filter(
      (a) => a.assigneeId === assigneeId && a.status !== "RELEASED" && a.status !== "COMPLETED"
    );
    if (active.length > 0) {
      throw new Error(`Assignee "${assigneeId}" already has an active exclusive assignment.`);
    }
  }
}
