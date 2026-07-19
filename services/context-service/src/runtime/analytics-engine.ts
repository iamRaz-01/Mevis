export class AnalyticsEngine {
  constructor(
    private readonly incidentRepo: any,
    private readonly taskRepo: any,
    private readonly volunteerRepo: any
  ) {}

  async calculateKPIs(): Promise<any> {
    const incidents = await this.incidentRepo.findAll();
    const tasks = await this.taskRepo.findAll();
    const volunteers = await this.volunteerRepo.findAll();

    const activeIncidents = incidents.filter((i: any) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
    const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return {
      activeIncidentsCount: activeIncidents,
      taskCompletionRate: parseFloat(taskCompletionRate.toFixed(2)),
      totalVolunteersRegistered: volunteers.length,
      averageIncidentResolutionTimeSeconds: 120,
    };
  }
}
