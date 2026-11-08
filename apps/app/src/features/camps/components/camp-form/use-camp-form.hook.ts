import { useState } from 'react';

import type { Camp } from '@repo/schema/camps';

import { useAppForm } from '@/core/form';
import { useUpdateCampMutation } from '@/features/camps/api/camps.queries';
import { campChangeOf, campFormOptions, campFormValues } from '@/features/camps/components/camp-form/camp-form.schema';
import { HttpError } from '@/lib/api';

export function useCampForm(organisationId: string, camp: Camp) {
  const update = useUpdateCampMutation(organisationId, camp.id);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    ...campFormOptions,
    defaultValues: campFormValues(camp),
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        const saved = await update.mutateAsync(campChangeOf(value));

        formApi.reset(campFormValues(saved));
        setStatus('saved');
      } catch (error) {
        // A slug another Camp has or had is shown at the slug; the form keeps its values.
        if (error instanceof HttpError && error.code === 'camp_slug_taken') {
          formApi.setFieldMeta('slug', (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onSubmit: error.code } }));
        } else {
          setStatus('failed');
        }
      }
    },
  });

  return { form, status };
}
