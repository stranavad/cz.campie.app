import { useState } from 'react';

import { useAppForm } from '@/core/form';
import { useRenameMutation } from '@/features/account-settings/api/account-settings.queries';
import { accountNameFormSchema } from '@/features/account-settings/components/account-name-form/account-name-form.schema';

export function useAccountNameForm(name: { firstName: string | null; lastName: string | null }) {
  const rename = useRenameMutation();
  const [failed, setFailed] = useState(false);

  const form = useAppForm({
    defaultValues: { firstName: name.firstName ?? '', lastName: name.lastName ?? '' },
    validators: { onChange: accountNameFormSchema },
    onSubmit: async ({ value }) => {
      setFailed(false);

      try {
        await rename.mutateAsync(accountNameFormSchema.parse(value));
      } catch {
        setFailed(true);
      }
    },
  });

  return { form, failed, isSaved: rename.isSuccess };
}
