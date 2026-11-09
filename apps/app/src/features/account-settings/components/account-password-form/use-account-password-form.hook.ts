import { useState } from 'react';

import { useAppForm } from '@/core/form';
import { useChangePasswordMutation } from '@/features/account-settings/api/account-settings.queries';
import {
  accountPasswordFormOptions,
  accountPasswordFormSchema,
} from '@/features/account-settings/components/account-password-form/account-password-form.schema';
import { failureOf, type AccountFormFailure } from '@/features/account-settings/helpers/account-failure.helper';

export function useAccountPasswordForm(email: string) {
  const change = useChangePasswordMutation();
  const [failure, setFailure] = useState<AccountFormFailure | null>(null);
  const schema = accountPasswordFormSchema(email);

  const form = useAppForm({
    ...accountPasswordFormOptions,
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      setFailure(null);

      try {
        await change.mutateAsync(schema.parse(value));
        formApi.reset();
      } catch (error) {
        const found = failureOf(error);

        if (found.field === 'currentPassword' || found.field === 'password') {
          formApi.setFieldMeta(found.field, (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: found.failure },
          }));
        } else {
          // The email is not asked here, so its code cannot come back.
          setFailure(found.field === null ? found.failure : 'unexpected');
        }
      }
    },
  });

  return { form, failure, isChanged: change.isSuccess };
}
