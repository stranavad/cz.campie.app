import { errorResponseSchema, type ErrorResponse } from '@repo/schema/shared';

export function readErrorResponse(body: unknown): ErrorResponse | null {
  const result = errorResponseSchema.safeParse(body);
  return result.success ? result.data : null;
}
