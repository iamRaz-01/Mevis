import { AsyncLocalStorage } from 'node:async_hooks';
import type http from 'node:http';

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly clientIp?: string;
}

export interface StandardResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors?: StandardError[];
  readonly metadata: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly service: string;
    readonly timestamp: string;
  };
}

export interface StandardError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

// Global thread-safe context storage
export const contextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Returns the current request context from storage, or generates a default one.
 */
export function getRequestContext(): RequestContext {
  return (
    contextStorage.getStore() ?? {
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    }
  );
}

/**
 * Maps Standard Errors
 */
export class PlatformError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'PlatformError';
  }

  toStandardError(): StandardError {
    return {
      code: this.code,
      message: this.message,
      ...(this.field ? { field: this.field } : {}),
    };
  }
}

export class ValidationError extends PlatformError {
  constructor(message: string, field?: string) {
    super(400, 'VALIDATION_FAILED', message, field);
  }
}

export class AuthenticationError extends PlatformError {
  constructor(message = 'Authentication required.') {
    super(401, 'UNAUTHENTICATED', message);
  }
}

export class AuthorizationError extends PlatformError {
  constructor(message = 'Permission denied.') {
    super(403, 'UNAUTHORIZED', message);
  }
}

export class NotFoundError extends PlatformError {
  constructor(message = 'Resource not found.') {
    super(404, 'NOT_FOUND', message);
  }
}

export class DependencyError extends PlatformError {
  constructor(message: string) {
    super(502, 'DEPENDENCY_FAILURE', message);
  }
}

export class CircuitOpenError extends PlatformError {
  constructor(serviceName: string) {
    super(503, 'CIRCUIT_OPEN', `Circuit to service "${serviceName}" is open.`);
  }
}

/**
 * Serializes trace headers from the current context for outbound requests.
 */
export function getTraceHeaders(): Record<string, string> {
  const ctx = getRequestContext();
  const headers: Record<string, string> = {
    'x-request-id': ctx.requestId,
    'x-correlation-id': ctx.correlationId,
  };
  if (ctx.actorId) headers['x-actor-id'] = ctx.actorId;
  if (ctx.actorRole) headers['x-actor-role'] = ctx.actorRole;
  return headers;
}

/**
 * Extracts tracing context from incoming HTTP headers.
 */
export function extractContext(req: http.IncomingMessage): RequestContext {
  const headers = req.headers;
  const requestId = (headers['x-request-id'] as string) || crypto.randomUUID();
  const correlationId = (headers['x-correlation-id'] as string) || requestId;
  const actorId = headers['x-actor-id'] as string | undefined;
  const actorRole = headers['x-actor-role'] as string | undefined;
  const clientIp = (headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

  return {
    requestId,
    correlationId,
    actorId,
    actorRole,
    clientIp,
  };
}

/**
 * Formulates a standardized API response envelope.
 */
export function createEnvelope<T>(
  success: boolean,
  data?: T,
  errors?: StandardError[],
  serviceName = 'unknown',
): StandardResponse<T> {
  const ctx = getRequestContext();
  return {
    success,
    data,
    errors,
    metadata: {
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      service: serviceName,
      timestamp: new Date().toISOString(),
    },
  };
}
