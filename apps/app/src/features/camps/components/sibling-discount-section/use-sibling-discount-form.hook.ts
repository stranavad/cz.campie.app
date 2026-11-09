import { useState } from 'react';

import type { Camp } from '@repo/schema/camps';

import { useAppForm } from '@/core/form';
import { useUpdateCampMutation } from '@/features/camps/api/camps.queries';
import {
  siblingDiscountChangeOf,
  siblingDiscountFormSchema,
  siblingDiscountFormValues,
} from '@/features/camps/components/sibling-discount-section/sibling-discount-form.schema';

export function useSiblingDiscountForm(organisationId: string, camp: Camp) {
  const update = useUpdateCampMutation(organisationId, camp.id);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: siblingDiscountFormValues(camp),
    validators: { onChange: siblingDiscountFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        formApi.reset(siblingDiscountFormValues(await update.mutateAsync(siblingDiscountChangeOf(value))));
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return { form, status };
}
