import { useState } from 'react';

import { useAppForm } from '@/core/form';
import { useCreateDiscountCodeMutation } from '@/features/camps/api/camps.queries';
import {
  DISCOUNT_CODE_FORM_DEFAULTS,
  discountCodeBodyOf,
  discountCodeFormSchema,
} from '@/features/camps/components/discount-code-section/discount-code-form.schema';
import { HttpError } from '@/lib/api';

export function useDiscountCodeForm(organisationId: string, campId: string) {
  const create = useCreateDiscountCodeMutation(organisationId, campId);
  const [hasFailed, setFailed] = useState(false);

  const form = useAppForm({
    defaultValues: DISCOUNT_CODE_FORM_DEFAULTS,
    validators: { onChange: discountCodeFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setFailed(false);

      try {
        await create.mutateAsync(discountCodeBodyOf(value));
        formApi.reset();
      } catch (error) {
        if (error instanceof HttpError && error.code === 'discount_code_taken') {
          formApi.setFieldMeta('code', (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onSubmit: error.code } }));
        } else {
          setFailed(true);
        }
      }
    },
  });

  return { form, hasFailed };
}
