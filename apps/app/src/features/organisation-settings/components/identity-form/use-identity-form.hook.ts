import { useState } from 'react';

import type { OrganisationSettings } from '@repo/schema/organisations';

import { useAppForm } from '@/core/form';
import { useUpdateOrganisationSettingsMutation } from '@/features/organisation-settings/api/organisation-settings.queries';
import {
  identityFormSchema,
  identityFormValues,
} from '@/features/organisation-settings/components/identity-form/identity-form.schema';

export function useIdentityForm(organisationId: string, settings: OrganisationSettings) {
  const update = useUpdateOrganisationSettingsMutation(organisationId);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: identityFormValues(settings),
    validators: { onChange: identityFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        // parse() applies the schema's trimming and the bank account's canonical form before sending.
        const saved = await update.mutateAsync(identityFormSchema.parse(value));

        formApi.reset(identityFormValues(saved));
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return { form, status };
}
