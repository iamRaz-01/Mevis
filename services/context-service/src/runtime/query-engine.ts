import { type VolunteerOperationalView, type IncidentOperationalView } from "./context";

export class OperationalQueryEngine {
  constructor(
    private readonly volunteerRepo: any,
    private readonly assignmentRepo: any,
    private readonly attendanceRepo: any,
    private readonly taskRepo: any,
    private readonly incidentRepo: any,
    private readonly incidentTimelineRepo: any
  ) {}

  async getVolunteerOperationalView(volunteerId: string): Promise<VolunteerOperationalView> {
    const volunteer = await this.volunteerRepo.findById(volunteerId);
    if (!volunteer) throw new Error(`Volunteer "${volunteerId}" not found.`);

    const allAssignments = await this.assignmentRepo.findAll();
    const volunteerAssignments = allAssignments.filter((a: any) => a.assignee_id === volunteerId);

    const allAttendance = await this.attendanceRepo.findAll();
    const volunteerAttendance = allAttendance.filter((a: any) => a.volunteer_id === volunteerId);

    const allTasks = await this.taskRepo.findAll();
    const volunteerTasks = allTasks.filter((t: any) => t.status !== "COMPLETED");

    return {
      volunteer: {
        id: volunteer.id,
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone,
        certifications: JSON.parse(volunteer.certifications_json || "[]"),
        languages: JSON.parse(volunteer.languages_json || "[]"),
        createdAt: volunteer.created_at,
      },
      assignments: volunteerAssignments,
      attendance: volunteerAttendance,
      currentTasks: volunteerTasks,
    };
  }

  async getIncidentOperationalView(incidentId: string): Promise<IncidentOperationalView> {
    const incident = await this.incidentRepo.findById(incidentId);
    if (!incident) throw new Error(`Incident "${incidentId}" not found.`);

    const allTimeline = await this.incidentTimelineRepo.findAll();
    const incidentTimeline = allTimeline.filter((t: any) => t.incident_id === incidentId);

    const allAssignments = await this.assignmentRepo.findAll();
    const incidentAssignments = allAssignments.filter((a: any) => a.target_id === incidentId);

    return {
      incident: {
        id: incident.id,
        severity: incident.severity,
        location: incident.location,
        status: incident.status,
        description: incident.description,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
      },
      timeline: incidentTimeline,
      assignments: incidentAssignments,
    };
  }
}
