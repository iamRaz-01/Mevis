import { type StandardError } from "./errors";
import { type PaginationMetadata } from "./pagination";

export interface StandardResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors?: readonly StandardError[];
  readonly metadata?: PaginationMetadata;
}
