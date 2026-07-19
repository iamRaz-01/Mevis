export interface StandardError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}
