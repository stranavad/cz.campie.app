import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { createCampBodySchema } from '@repo/schema/camps';

export const createCampFormSchema = createCampBodySchema;

export type CreateCampFormValues = z.input<typeof createCampFormSchema>;

const CREATE_CAMP_FORM_DEFAULTS: CreateCampFormValues = {
  name: '',
  slug: '',
  websiteUrl: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

export const createCampFormOptions = formOptions({
  defaultValues: CREATE_CAMP_FORM_DEFAULTS,
  validators: { onChange: createCampFormSchema },
});
