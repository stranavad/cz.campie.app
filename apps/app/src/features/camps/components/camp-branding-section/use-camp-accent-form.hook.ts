import { useState } from 'react';

import type { CampBranding } from '@repo/schema/camps';
import { accentColourSchema } from '@repo/schema/organisations';

import { useAppForm } from '@/core/form';
import { useUpdateCampBrandingMutation } from '@/features/camps/api/camps.queries';
import { campAccentFormSchema } from '@/features/camps/components/camp-branding-section/camp-accent-form.schema';

/**
 * Fill the form from the saved branding: a Camp without its own colour starts from the one it wears.
 * @param branding the Camp's branding
 */
function valuesOf(branding: CampBranding) {
  return {
    ownColour: branding.accentColour !== null,
    accentColour: branding.accentColour ?? branding.effective.accentColour,
  };
}

export function useCampAccentForm(organisationId: string, campId: string, branding: CampBranding) {
  const update = useUpdateCampBrandingMutation(organisationId, campId);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: valuesOf(branding),
    validators: { onChange: campAccentFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        const accentColour = value.ownColour ? accentColourSchema.parse(value.accentColour) : null;
        const saved = await update.mutateAsync({ accentColour });

        formApi.reset(valuesOf(saved));
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return { form, status };
}
