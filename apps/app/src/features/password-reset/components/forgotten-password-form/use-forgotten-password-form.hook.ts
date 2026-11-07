import { useState } from 'react';

import { REQUEST_LIMIT_ERROR_CODES } from '@repo/schema/shared';

import { useAppForm } from '@/core/form';
import { useRequestPasswordResetMutation } from '@/features/password-reset/api/password-reset.queries';
import {
  forgottenPasswordFormOptions,
  forgottenPasswordFormSchema,
} from '@/features/password-reset/components/forgotten-password-form/forgotten-password-form.schema';
import { HttpError } from '@/lib/api';

// What the form shows above its button when the API refuses.
export type ForgottenPasswordFailure = 'requests_throttled' | 'unexpected';

export function useForgottenPasswordForm() {
  const requestReset = useRequestPasswordResetMutation();
  const [failure, setFailure] = useState<ForgottenPasswordFailure | null>(null);

  const form = useAppForm({
    ...forgottenPasswordFormOptions,
    onSubmit: async ({ value }) => {
      setFailure(null);

      try {
        await requestReset.mutateAsync(forgottenPasswordFormSchema.parse(value));
      } catch (error) {
        const code = error instanceof HttpError ? error.code : undefined;

        setFailure(REQUEST_LIMIT_ERROR_CODES.find((known) => known === code) ?? 'unexpected');
      }
    },
  });

  return { form, isSent: requestReset.isSuccess, failure };
}
