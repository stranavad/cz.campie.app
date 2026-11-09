import { useState } from 'react';

import { useAppForm } from '@/core/form';
import { useRequestEmailChangeMutation } from '@/features/account-settings/api/account-settings.queries';
import {
  accountEmailFormOptions,
  accountEmailFormSchema,
} from '@/features/account-settings/components/account-email-form/account-email-form.schema';
import { failureOf, type AccountFormFailure } from '@/features/account-settings/helpers/account-failure.helper';

export function useAccountEmailForm() {
  const request = useRequestEmailChangeMutation();
  const [failure, setFailure] = useState<AccountFormFailure | null>(null);
  // Where the link went, for the confirmation shown once it is sent.
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useAppForm({
    ...accountEmailFormOptions,
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);
      setSentTo(null);
      const body = accountEmailFormSchema.parse(value);

      try {
        await request.mutateAsync(body);
        setSentTo(body.email);
        formApi.reset();
      } catch (error) {
        const found = failureOf(error);

        formApi.resetField('currentPassword');

        if (found.field === 'currentPassword' || found.field === 'email') {
          formApi.setFieldMeta(found.field, (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: found.failure },
          }));
        } else {
          // A new password is not asked here, so its codes cannot come back.
          setFailure(found.field === null ? found.failure : 'unexpected');
        }
      }
    },
  });

  return { form, failure, sentTo };
}
