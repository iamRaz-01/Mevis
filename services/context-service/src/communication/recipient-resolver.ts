export class RecipientResolver {
  resolveRecipients(eventType: string, payload: any): string[] {
    if (eventType === "IncidentCreated") {
      return ["ROLE_COMMAND_CENTER", "ROLE_MEDIC_SUPERVISOR"];
    }
    if (eventType === "VolunteerAssigned") {
      return [payload.assigneeId, "ROLE_VOLUNTEER_SUPERVISOR"];
    }
    if (eventType === "TaskCreated") {
      return ["ROLE_FIELD_COORDINATOR"];
    }
    return ["ROLE_OPERATOR"];
  }
}
