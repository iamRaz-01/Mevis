import { type ReleaseMetadata } from "@mevis/platform-contracts";

export class ReleaseService {
  private readonly metadata: ReleaseMetadata;

  constructor() {
    this.metadata = {
      version: process.env.RELEASE_VERSION || "1.0.0-release.4",
      environment: process.env.NODE_ENV || "development",
      commitSha: process.env.COMMIT_SHA || "sha-m4-last-commit",
      buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
    };
  }

  /**
   * Retrieves active release details.
   */
  getMetadata(): ReleaseMetadata {
    return { ...this.metadata };
  }
}

export const releaseInfo = new ReleaseService();
