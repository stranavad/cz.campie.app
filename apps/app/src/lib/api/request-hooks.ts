import { ACCESS_HEADERS } from '@repo/schema/shared';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Every API request passes through here; errors thrown here reach the caller unchanged.

export function onRequest(request: Request): Request {
  // The API refuses a mutation without it: a cross-site page cannot add a custom header.
  if (!SAFE_METHODS.has(request.method)) {
    request.headers.set(ACCESS_HEADERS.csrf, '1');
  }

  return request;
}

export function onResponse(response: Response): Response {
  return response;
}
