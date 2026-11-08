import { createHash, timingSafeEqual } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import type { RequestHandler } from 'express';

import type { ErrorResponse } from '@repo/schema/shared';

// Set by the frontend's proxy on every request it forwards, replacing whatever the client sent.
export const PROXY_SECRET_HEADER = 'x-proxy-secret';

function digestOf(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/**
 * Refuse every request that does not carry the proxy's secret, before routing, body parsing or any guard.
 * Comparing digests keeps the comparison constant-time whatever the length of what the client sent.
 * @param secret the secret the proxy sends
 */
export function requireProxySecret(secret: string): RequestHandler {
  const expected = digestOf(secret);
  const refusal = { statusCode: HttpStatus.FORBIDDEN, message: 'Forbidden' } satisfies ErrorResponse;

  return (request, response, next) => {
    const given = request.get(PROXY_SECRET_HEADER);

    if (given !== undefined && timingSafeEqual(digestOf(given), expected)) {
      next();

      return;
    }

    response.status(refusal.statusCode).json(refusal);
  };
}
