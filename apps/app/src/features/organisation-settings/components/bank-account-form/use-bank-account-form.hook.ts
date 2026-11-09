import { useState } from 'react';

import type { OrganisationSettings } from '@repo/schema/organisations';

import { useAppForm } from '@/core/form';
import { useUpdateOrganisationSettingsMutation } from '@/features/organisation-settings/api/organisation-settings.queries';
import {
  bankAccountFormSchema,
  bankAccountFormValues,
} from '@/features/organisation-settings/components/bank-account-form/bank-account-form.schema';

export function useBankAccountForm(organisationId: string, settings: OrganisationSettings) {
  const update = useUpdateOrganisationSettingsMutation(organisationId);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: bankAccountFormValues(settings),
    validators: { onChange: bankAccountFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        // parse() brings the bank account to its canonical form before sending.
        const saved = await update.mutateAsync(bankAccountFormSchema.parse(value));

        formApi.reset(bankAccountFormValues(saved));
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return { form, status };
}
