import { EMAIL_CHANGE_ERROR_CODES, type EmailChangeErrorCode } from '@repo/schema/admins';

import { useConfirmEmailChangeMutation } from '@/features/email-change/api/email-change.queries';
import { HttpError } from '@/lib/api';

export function useEmailChangePage(token: string) {
  const change = useConfirmEmailChangeMutation();
  const code = change.error instanceof HttpError ? change.error.code : undefined;
  const failure: EmailChangeErrorCode | 'unexpected' | null = change.isError
    ? (EMAIL_CHANGE_ERROR_CODES.find((known) => known === code) ?? 'unexpected')
    : null;

  return {
    confirm: () => change.mutate({ token }),
    isDone: change.isSuccess,
    isPending: change.isPending,
    failure,
  };
}
