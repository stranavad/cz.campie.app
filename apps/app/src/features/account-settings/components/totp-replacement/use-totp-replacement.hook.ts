import { useState } from 'react';

import {
  startTotpReplacementBodySchema,
  TOTP_ERROR_CODES,
  type TotpEnrolment,
  type TotpErrorCode,
} from '@repo/schema/admins';

import { useAppForm } from '@/core/form';
import {
  useConfirmTotpReplacementMutation,
  useStartTotpReplacementMutation,
} from '@/features/account-settings/api/account-settings.queries';
import { HttpError } from '@/lib/api';

export type TotpReplacementFailure = TotpErrorCode | 'unexpected';

function failureOf(error: unknown): TotpReplacementFailure {
  const code = error instanceof HttpError ? error.code : undefined;

  return TOTP_ERROR_CODES.find((known) => known === code) ?? 'unexpected';
}

// Moving two-step login to a new phone: a code from the old app gives a new key, a code from the new app
// moves it. Until then the old app keeps working.
export function useTotpReplacement() {
  const start = useStartTotpReplacementMutation();
  const confirm = useConfirmTotpReplacementMutation();
  const [enrolment, setEnrolment] = useState<TotpEnrolment | null>(null);
  const [failure, setFailure] = useState<TotpReplacementFailure | null>(null);

  const form = useAppForm({
    defaultValues: { code: '' },
    validators: { onSubmit: startTotpReplacementBodySchema },
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);
      const body = startTotpReplacementBodySchema.parse(value);

      try {
        if (enrolment === null) {
          setEnrolment(await start.mutateAsync(body));
        } else {
          await confirm.mutateAsync(body);
        }
      } catch (error) {
        setFailure(failureOf(error));
      } finally {
        // A code is good for half a minute and once; the next step needs a fresh one.
        formApi.resetField('code');
      }
    },
  });

  return { form, enrolment, failure, isDone: confirm.isSuccess };
}
