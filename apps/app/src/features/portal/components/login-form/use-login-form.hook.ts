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

  const form = useAppForm({
    ...loginFormOptions,
    onSubmit: async ({ value }) => {
      setFailure(null);

      try {
        await requestLink.mutateAsync(loginFormSchema.parse(value));
      } catch (error) {
        const code = error instanceof HttpError ? error.code : undefined;

        setFailure(REQUEST_LIMIT_ERROR_CODES.find((known) => known === code) ?? 'unexpected');
      }
    },
  });

  return { form, isSent: requestLink.isSuccess, failure };
}
