export class ContextResolver {
  constructor(
    private readonly volunteerRepo: any,
    private readonly incidentRepo: any,
    private readonly venueRepo: any
  ) {}

  async resolveContext(userId: string, incidentId?: string, venueId?: string): Promise<any> {
    const vol = await this.volunteerRepo.findById(userId);
    const inc = incidentId ? await this.incidentRepo.findById(incidentId) : null;
    const ven = venueId ? await this.venueRepo.findById(venueId) : null;

    return {
      volunteerName: vol?.name || "System Assistant User",
      incidentDescription: inc?.description || "No Active Incident Context",
      venueName: ven?.name || "Unassigned Venue Location",
    };
  }
}
