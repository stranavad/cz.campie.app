import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { slugify } from '@repo/schema/shared';

import { useAppForm } from '@/core/form';
import { useCreateCampMutation } from '@/features/camps/api/camps.queries';
import {
  createCampFormOptions,
  createCampFormSchema,
} from '@/features/camps/components/create-camp-form/create-camp-form.schema';
import { HttpError } from '@/lib/api';

export function useCreateCampForm(organisationId: string, onCreated: () => void) {
  const create = useCreateCampMutation(organisationId);
  const navigate = useNavigate();
  const [hasFailed, setFailed] = useState(false);

  const form = useAppForm({
    ...createCampFormOptions,
    // The slug follows the name until it is edited by hand.
    listeners: {
      onChange: ({ formApi, fieldApi }) => {
        if (fieldApi.name === 'name' && formApi.getFieldMeta('slug')?.isDirty !== true) {
          formApi.setFieldValue('slug', slugify(formApi.getFieldValue('name')), { dontUpdateMeta: true });
        }
      },
    },
    onSubmit: async ({ value, formApi }) => {
      setFailed(false);

      try {
        const camp = await create.mutateAsync(createCampFormSchema.parse(value));

        formApi.reset();
        onCreated();
        await navigate({ to: '/platform/tabory', search: { tabor: camp.id } });
      } catch (error) {
        if (error instanceof HttpError && error.code === 'camp_slug_taken') {
          formApi.setFieldMeta('slug', (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onSubmit: error.code } }));
        } else {
          setFailed(true);
        }
      }
    },
  });

  return { form, hasFailed };
}
