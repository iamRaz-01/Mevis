export class PlaybackEngine {
  constructor(private readonly auditRepo: any) {}

  async getPlaybackStream(): Promise<any[]> {
    const list = await this.auditRepo.findAll();
    return list.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));
  }
}
