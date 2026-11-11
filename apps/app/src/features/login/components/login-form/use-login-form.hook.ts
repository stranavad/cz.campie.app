import { useNavigate, useRouter } from '@tanstack/react-router';
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

// Only a path of this site: a link must never send a fresh login elsewhere.
export function isReturnPath(path: string | undefined): path is string {
  if (path === undefined || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return false;
  }

  // Browsers read a backslash as a slash and drop tabs and newlines, which can turn a path into another host.
  if (path.split('').some((char) => char === '\\' || char <= '\u001f' || char === '\u007f')) {
    return false;
  }

  return !/^\/prihlaseni([/?#]|$)/.test(path);
}

export function useLoginForm(returnTo: string | undefined) {
  const logIn = useLogInMutation();
  const navigate = useNavigate();
  const router = useRouter();
  const [failure, setFailure] = useState<LoginFailure | null>(null);

  const form = useAppForm({
    ...loginFormOptions,
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);

      try {
        await logIn.mutateAsync(loginFormSchema.parse(value));

        if (isReturnPath(returnTo)) {
          // The history takes the address as the browser shows it.
          router.history.push(returnTo);
        } else {
          await navigate({ to: '/platform' });
        }
      } catch (error) {
        // The email stays for a retry; the wrong password goes.
        formApi.resetField('password');
        setFailure(failureOf(error));
      }
    },
  });

  return { form, failure };
}
