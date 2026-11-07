import { useState } from 'react';

import type { OrganisationSettings } from '@repo/schema/organisations';

import { useAppForm } from '@/core/form';
import { useUpdateOrganisationSettingsMutation } from '@/features/organisation-settings/api/organisation-settings.queries';
import {
  brandingFormSchema,
  brandingFormValues,
} from '@/features/organisation-settings/components/branding-form/branding-form.schema';

export function useBrandingForm(organisationId: string, settings: OrganisationSettings) {
  const update = useUpdateOrganisationSettingsMutation(organisationId);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: brandingFormValues(settings),
    validators: { onChange: brandingFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        const saved = await update.mutateAsync(brandingFormSchema.parse(value));

        formApi.reset(brandingFormValues(saved));
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return { form, status };
}
