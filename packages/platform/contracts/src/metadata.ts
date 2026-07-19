export interface ReleaseMetadata {
  readonly version: string;
  readonly environment: string;
  readonly commitSha: string;
  readonly buildTimestamp: string;
}
