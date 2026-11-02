import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { PASSWORD_ERROR_CODES } from '@repo/schema/shared';

import { useAppForm } from '@/core/form';
import { useAcceptInvitationMutation } from '@/features/invitation/api/invitation.queries';
import {
  newAccountFormOptions,
  newAccountFormSchema,
} from '@/features/invitation/components/new-account-form/new-account-form.schema';
import { HttpError } from '@/lib/api';

// What the page shows above the button when the API refuses for a reason the password field does not hold.
export type NewAccountFailure = 'invitation_invalid' | 'unexpected';

export function useNewAccountForm(token: string, email: string) {
  const accept = useAcceptInvitationMutation();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<NewAccountFailure | null>(null);
  const schema = newAccountFormSchema(email);

  const form = useAppForm({
    ...newAccountFormOptions,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);

      try {
        await accept.mutateAsync({ token, ...schema.parse(value) });
        await navigate({ to: '/platform', replace: true });
      } catch (error) {
        const code = error instanceof HttpError ? error.code : undefined;
        const passwordCode = PASSWORD_ERROR_CODES.find((known) => known === code);

        if (passwordCode !== undefined) {
          formApi.setFieldMeta('password', (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: passwordCode },
          }));
        } else {
          setFailure(code === 'invitation_invalid' ? 'invitation_invalid' : 'unexpected');
        }
      }
    },
  });

  return { form, failure };
}
