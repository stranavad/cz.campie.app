import { useState } from 'react';

import { REQUEST_LIMIT_ERROR_CODES } from '@repo/schema/shared';

import { useAppForm } from '@/core/form';
import { useRequestLoginLinkMutation } from '@/features/portal/api/portal.queries';
import { loginFormOptions, loginFormSchema } from '@/features/portal/components/login-form/login-form.schema';
import { HttpError } from '@/lib/api';

// What the form shows above its button when the API refuses.
export type LoginFailure = 'requests_throttled' | 'unexpected';

export function useLoginForm() {
  const requestLink = useRequestLoginLinkMutation();
  const [failure, setFailure] = useState<LoginFailure | null>(null);
  // The address the link went to, repeated on the card that replaces the form.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isResent, setIsResent] = useState(false);

  const send = async (email: string) => {
    setFailure(null);

    try {
      await requestLink.mutateAsync({ email });
      setSentTo(email);

      return true;
    } catch (error) {
      const code = error instanceof HttpError ? error.code : undefined;

      setFailure(REQUEST_LIMIT_ERROR_CODES.find((known) => known === code) ?? 'unexpected');

      return false;
    }
  };

  const form = useAppForm({
    ...loginFormOptions,
    onSubmit: async ({ value }) => {
      await send(loginFormSchema.parse(value).email);
    },
  });

  return {
    form,
    sentTo,
    failure,
    isResending: requestLink.isPending,
    isResent,
    resend: async () => {
      setIsResent(false);
      setIsResent(sentTo !== null && (await send(sentTo)));
    },
  };
}
