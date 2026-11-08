import { useState } from 'react';

import { TOTP_ERROR_CODES, type TotpErrorCode } from '@repo/schema/admins';

import { useAppForm } from '@/core/form';
import {
  useConfirmTotpEnrolmentMutation,
  useRegenerateRecoveryCodesMutation,
  useVerifyTotpMutation,
} from '@/core/two-step/api/two-step.queries';
import {
  totpCodeFormOptions,
  totpCodeFormSchemas,
} from '@/core/two-step/components/totp-code-form/totp-code-form.schema';
import { HttpError } from '@/lib/api';

// confirm turns TOTP on with the first code; regenerate makes new recovery codes; verify passes a later login.
export type TotpCodePurpose = 'confirm' | 'regenerate' | 'verify';

export type TotpCodeFailure = TotpErrorCode | 'unexpected';

function failureOf(error: unknown): TotpCodeFailure {
  const code = error instanceof HttpError ? error.code : undefined;

  return TOTP_ERROR_CODES.find((known) => known === code) ?? 'unexpected';
}

export function useTotpCodeForm(purpose: TotpCodePurpose, onConfirmed?: (recoveryCodes: string[]) => void) {
  const confirm = useConfirmTotpEnrolmentMutation();
  const verify = useVerifyTotpMutation();
  const regenerate = useRegenerateRecoveryCodesMutation();
  const [failure, setFailure] = useState<TotpCodeFailure | null>(null);
  const schema = totpCodeFormSchemas[purpose];

  const form = useAppForm({
    ...totpCodeFormOptions,
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);

      try {
        if (purpose === 'confirm') {
          onConfirmed?.((await confirm.mutateAsync(schema.parse(value))).recoveryCodes);
        } else if (purpose === 'regenerate') {
          onConfirmed?.((await regenerate.mutateAsync(schema.parse(value))).recoveryCodes);
        } else {
          await verify.mutateAsync(schema.parse(value));
        }
      } catch (error) {
        // A code is good for half a minute; the next attempt needs a fresh one.
        formApi.resetField('code');
        setFailure(failureOf(error));
      }
    },
  });

  return { form, failure };
}
