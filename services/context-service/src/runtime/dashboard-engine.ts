import { type OperationsDashboardView } from "./context";

export class DashboardEngine {
  constructor(
    private readonly incidentRepo: any,
    private readonly taskRepo: any,
    private readonly resourceRepo: any,
    private readonly attendanceRepo: any
  ) {}

  async getOperationsDashboard(): Promise<OperationsDashboardView> {
    const incidents = await this.incidentRepo.findAll();
    const activeIncidents = incidents.filter((i: any) => i.status !== "RESOLVED" && i.status !== "CLOSED");

    const tasks = await this.taskRepo.findAll();
    const openTasks = tasks.filter((t: any) => t.status !== "COMPLETED" && t.status !== "ARCHIVED");

    const resources = await this.resourceRepo.findAll();
    const availableResources = resources.length;

    const attendance = await this.attendanceRepo.findAll();
    const checkedInVolunteers = attendance.filter((a: any) => a.status === "CHECKED_IN");

    return {
      activeIncidentsCount: activeIncidents.length,
      openTasksCount: openTasks.length,
      availableResourcesCount: availableResources,
      checkedInVolunteersCount: checkedInVolunteers.length,
    };
  }

  async getMedicalDashboard(): Promise<any> {
    const dashboard = await this.getOperationsDashboard();
    return {
      ...dashboard,
      department: "MEDICAL",
      activeMedicalIncidentsCount: dashboard.activeIncidentsCount,
    };
  }

  async getSecurityDashboard(): Promise<any> {
    const dashboard = await this.getOperationsDashboard();
    return {
      ...dashboard,
      department: "SECURITY",
      activeSecurityIncidentsCount: dashboard.activeIncidentsCount,
    };
  }
}
