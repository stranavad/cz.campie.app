import type * as z from 'zod';

/** Base class for every error thrown by `apiClient`. Narrow with `instanceof` or `error.kind`. */
export abstract class ApiError extends Error {
  abstract readonly kind: 'network' | 'timeout' | 'http' | 'validation' | 'unknown';

  override name = 'ApiError';
}

/** The request never got a response (offline, DNS, CORS, server down). */
export class NetworkError extends ApiError {
  override name = 'NetworkError';
  readonly kind = 'network';
}

export class TimeoutError extends ApiError {
  override name = 'TimeoutError';
  readonly kind = 'timeout';
}

/** The server responded with a non-2xx status. */
export class HttpError extends ApiError {
  override name = 'HttpError';
  readonly kind = 'http';
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, params: { status: number; code?: string; details?: unknown; cause?: unknown }) {
    super(message, { cause: params.cause });
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

/** The response did not match the expected Zod schema. */
export class ResponseValidationError extends ApiError {
  override name = 'ResponseValidationError';
  readonly kind = 'validation';
  readonly issues: readonly z.core.$ZodIssue[];

  constructor(message: string, params: { issues: readonly z.core.$ZodIssue[]; cause?: unknown }) {
    super(message, { cause: params.cause });
    this.issues = params.issues;
  }
}

export class UnknownApiError extends ApiError {
  override name = 'UnknownApiError';
  readonly kind = 'unknown';
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
