import { useState } from 'react';

import { useAppForm } from '@/core/form';
import { useRequestPasswordResetMutation } from '@/features/password-reset/api/password-reset.queries';
import {
  forgottenPasswordFormOptions,
  forgottenPasswordFormSchema,
} from '@/features/password-reset/components/forgotten-password-form/forgotten-password-form.schema';

export function useForgottenPasswordForm() {
  const requestReset = useRequestPasswordResetMutation();
  const [hasFailed, setHasFailed] = useState(false);

  const form = useAppForm({
    ...forgottenPasswordFormOptions,
    onSubmit: async ({ value }) => {
      setHasFailed(false);

      try {
        await requestReset.mutateAsync(forgottenPasswordFormSchema.parse(value));
      } catch {
        setHasFailed(true);
      }
    },
  });

  return { form, isSent: requestReset.isSuccess, hasFailed };
}
