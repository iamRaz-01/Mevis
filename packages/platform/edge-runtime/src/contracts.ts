import {
  createEnvelope,
  type StandardResponse,
  type StandardError,
} from '@mevis/platform-communication';

export interface PaginatedMetadata {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedResponse<T = unknown> extends StandardResponse<T[]> {
  readonly pagination: PaginatedMetadata;
}

export function normalizeResponse<T>(
  success: boolean,
  data?: T,
  errors?: StandardError[],
  serviceName = 'edge-gateway',
): StandardResponse<T> {
  return createEnvelope(success, data, errors, serviceName);
}

export function normalizePaginatedResponse<T>(
  data: T[],
  pagination: PaginatedMetadata,
  serviceName = 'edge-gateway',
): PaginatedResponse<T> {
  const envelope = createEnvelope(true, data, undefined, serviceName);
  return {
    ...envelope,
    pagination,
  };
}
