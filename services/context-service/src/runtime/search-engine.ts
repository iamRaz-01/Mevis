export class SearchEngine {
  constructor(
    private readonly volunteerRepo: any,
    private readonly venueRepo: any,
    private readonly incidentRepo: any,
    private readonly taskRepo: any
  ) {}

  async search(query: string): Promise<any[]> {
    if (!query) return [];
    const term = query.toLowerCase();

    const results: any[] = [];

    const volunteers = await this.volunteerRepo.findAll();
    for (const v of volunteers) {
      if (v.name.toLowerCase().includes(term) || v.email.toLowerCase().includes(term)) {
        results.push({ type: "Volunteer", id: v.id, label: v.name, data: v });
      }
    }

    const venues = await this.venueRepo.findAll();
    for (const vn of venues) {
      if (vn.name.toLowerCase().includes(term)) {
        results.push({ type: "Venue", id: vn.id, label: vn.name, data: vn });
      }
    }

    const incidents = await this.incidentRepo.findAll();
    for (const inc of incidents) {
      if (inc.description.toLowerCase().includes(term) || inc.location.toLowerCase().includes(term)) {
        results.push({ type: "Incident", id: inc.id, label: inc.description, data: inc });
      }
    }

    const tasks = await this.taskRepo.findAll();
    for (const t of tasks) {
      if (t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)) {
        results.push({ type: "Task", id: t.id, label: t.title, data: t });
      }
    }

    return results;
  }
}
