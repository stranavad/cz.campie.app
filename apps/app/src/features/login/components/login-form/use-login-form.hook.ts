import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { LOG_IN_ERROR_CODES, type LogInErrorCode } from '@repo/schema/admins';

import { useAppForm } from '@/core/form';
import { useLogInMutation } from '@/features/login/api/login.queries';
import { loginFormOptions, loginFormSchema } from '@/features/login/components/login-form/login-form.schema';
import { HttpError } from '@/lib/api';

// What the form shows above its button when the API refuses.
export type LoginFailure = LogInErrorCode | 'unexpected';

function failureOf(error: unknown): LoginFailure {
  const code = error instanceof HttpError ? error.code : undefined;

  return LOG_IN_ERROR_CODES.find((known) => known === code) ?? 'unexpected';
}

export function useLoginForm() {
  const logIn = useLogInMutation();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<LoginFailure | null>(null);

  const form = useAppForm({
    ...loginFormOptions,
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);

      try {
        await logIn.mutateAsync(loginFormSchema.parse(value));
        await navigate({ to: '/platform' });
      } catch (error) {
        // The email stays for a retry; the wrong password goes.
        formApi.resetField('password');
        setFailure(failureOf(error));
      }
    },
  });

  return { form, failure };
}
