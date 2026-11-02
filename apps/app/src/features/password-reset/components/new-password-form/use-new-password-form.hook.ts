import { useState } from 'react';

import { PASSWORD_ERROR_CODES } from '@repo/schema/shared';

import { useAppForm } from '@/core/form';
import { useResetPasswordMutation } from '@/features/password-reset/api/password-reset.queries';
import {
  newPasswordFormOptions,
  newPasswordFormSchema,
} from '@/features/password-reset/components/new-password-form/new-password-form.schema';
import { HttpError } from '@/lib/api';

// What the page shows instead of the form, or above its button, when the API refuses for a reason the
// password field does not hold.
export type NewPasswordFailure = 'password_reset_invalid' | 'unexpected';

export function useNewPasswordForm(token: string) {
  const reset = useResetPasswordMutation();
  const [failure, setFailure] = useState<NewPasswordFailure | null>(token === '' ? 'password_reset_invalid' : null);

  const form = useAppForm({
    ...newPasswordFormOptions,
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);

      try {
        await reset.mutateAsync({ token, ...newPasswordFormSchema.parse(value) });
      } catch (error) {
        const code = error instanceof HttpError ? error.code : undefined;
        const passwordCode = PASSWORD_ERROR_CODES.find((known) => known === code);

        if (passwordCode !== undefined) {
          formApi.setFieldMeta('password', (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: passwordCode },
          }));
        } else {
          setFailure(code === 'password_reset_invalid' ? 'password_reset_invalid' : 'unexpected');
        }
      }
    },
  });

  return { form, failure, isDone: reset.isSuccess };
}
