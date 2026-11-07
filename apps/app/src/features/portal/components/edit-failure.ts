import { GUARDIAN_EDIT_ERROR_CODES, type GuardianEditErrorCode } from '@repo/schema/portal';
import { REQUEST_LIMIT_ERROR_CODES, type RequestLimitErrorCode } from '@repo/schema/shared';

import { HttpError } from '@/lib/api';

/**
 * Name why an edit failed, as the portal translates it.
 * @param error what the edit failed with
 */
export function editFailureOf(
  error: Error | null,
): GuardianEditErrorCode | RequestLimitErrorCode | 'unexpected' | null {
  if (error === null) {
    return null;
  }

  const code = error instanceof HttpError ? error.code : undefined;

  return [...GUARDIAN_EDIT_ERROR_CODES, ...REQUEST_LIMIT_ERROR_CODES].find((known) => known === code) ?? 'unexpected';
}
