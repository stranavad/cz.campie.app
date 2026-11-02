import { useState } from 'react';

import { TOTP_ERROR_CODES, type TotpErrorCode } from '@repo/schema/admins';

import { useAppForm } from '@/core/form';
import { useConfirmTotpEnrolmentMutation, useVerifyTotpMutation } from '@/features/console/api/console.queries';
import {
  totpCodeFormOptions,
  totpCodeFormSchema,
} from '@/features/console/components/totp-code-form/totp-code-form.schema';
import { HttpError } from '@/lib/api';

// confirm turns TOTP on with the first code; verify passes a later login.
export type TotpCodePurpose = 'confirm' | 'verify';

export type TotpCodeFailure = TotpErrorCode | 'unexpected';

function failureOf(error: unknown): TotpCodeFailure {
  const code = error instanceof HttpError ? error.code : undefined;

  return TOTP_ERROR_CODES.find((known) => known === code) ?? 'unexpected';
}

export function useTotpCodeForm(purpose: TotpCodePurpose) {
  const confirm = useConfirmTotpEnrolmentMutation();
  const verify = useVerifyTotpMutation();
  const [failure, setFailure] = useState<TotpCodeFailure | null>(null);

  const form = useAppForm({
    ...totpCodeFormOptions,
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);

      try {
        await (purpose === 'confirm' ? confirm : verify).mutateAsync(totpCodeFormSchema.parse(value));
      } catch (error) {
        // A code is good for half a minute; the next attempt needs a fresh one.
        formApi.resetField('code');
        setFailure(failureOf(error));
      }
    },
  });

  return { form, failure };
}
