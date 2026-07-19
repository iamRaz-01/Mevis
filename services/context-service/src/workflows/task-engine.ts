export class TaskEngine {
  validateTransition(currentStatus: string, nextStatus: string): void {
    const validMap: Record<string, string[]> = {
      "CREATED": ["ASSIGNED", "ACCEPTED"],
      "ASSIGNED": ["ACCEPTED", "IN_PROGRESS"],
      "ACCEPTED": ["IN_PROGRESS", "COMPLETED"],
      "IN_PROGRESS": ["COMPLETED"],
      "COMPLETED": ["VERIFIED"],
      "VERIFIED": ["ARCHIVED"],
      "ARCHIVED": [],
    };

    const allowed = validMap[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition from "${currentStatus}" to "${nextStatus}".`);
    }
  }
}
