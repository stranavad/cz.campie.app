import type { AccountErrorCode } from '@repo/schema/admins';
import { PASSWORD_ERROR_CODES, type PasswordErrorCode } from '@repo/schema/shared';

import { HttpError } from '@/lib/api';

// What a refused change of the account shows above its button; a field's own refusal shows at the field.
export type AccountFormFailure = 'login_throttled' | 'requests_throttled' | 'unexpected';

/**
 * Sort a refused change of the account: a wrong current password or the account's own email at their
 * field, a weak new password at the new password's, everything else above the button.
 * @param error what the request threw
 */
export function failureOf(
  error: unknown,
):
  | { field: 'currentPassword' | 'email'; failure: AccountErrorCode }
  | { field: 'password'; failure: PasswordErrorCode }
  | { field: null; failure: AccountFormFailure } {
  const code = error instanceof HttpError ? error.code : undefined;

  if (code === 'current_password_invalid') {
    return { field: 'currentPassword', failure: code };
  }

  if (code === 'email_unchanged') {
    return { field: 'email', failure: code };
  }

  const passwordCode = PASSWORD_ERROR_CODES.find((known) => known === code);

  if (passwordCode !== undefined) {
    return { field: 'password', failure: passwordCode };
  }

  return {
    field: null,
    failure: code === 'login_throttled' || code === 'requests_throttled' ? code : 'unexpected',
  };
}
