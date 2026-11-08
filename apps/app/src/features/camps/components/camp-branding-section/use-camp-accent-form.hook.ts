import { useState } from 'react';

import type { CampBranding } from '@repo/schema/camps';
import { accentColourSchema } from '@repo/schema/organisations';

import { useCurrentMembership } from '@/core/account';
import { useAppForm } from '@/core/form';
import { useUpdateCampBrandingMutation } from '@/features/camps/api/camps.queries';
import {
  campAccentFormSchema,
  type CampAccentFormValues,
} from '@/features/camps/components/camp-branding-section/camp-accent-form.schema';

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
  const { membership } = useCurrentMembership();
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

  return {
    form,
    status,
    // A swatch or the picker sets the colour as if typed, so it is checked the same way.
    pick: (colour: string) => form.setFieldValue('accentColour', colour),
    // The preview wears the colour being typed once it reads as one, else the colour saved or inherited.
    previewColourOf: ({ ownColour, accentColour }: CampAccentFormValues) => {
      const typed = accentColourSchema.safeParse(accentColour);

      if (ownColour) {
        return typed.success ? typed.data : branding.effective.accentColour;
      }

      // Without its own colour the Camp wears the Organisation's, even while its own is still saved.
      return membership?.organisation.accentColour ?? branding.effective.accentColour;
    },
  };
}
