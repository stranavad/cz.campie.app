import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

import { campFieldsSchema, type Camp, type UpdateCampBody } from '@repo/schema/camps';

// The Camp's identity, description, contact, modules and lock date, saved together from the first tab; the Sibling
// discount and the team's addresses are saved from their own tabs. An empty lock date is none.
const campBasicsSchema = campFieldsSchema.pick({
  name: true,
  slug: true,
  websiteUrl: true,
  description: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  modules: true,
  contactEditLockDate: true,
});

export const campFormSchema = campBasicsSchema.extend({ contactEditLockDate: z.string() });

export type CampFormValues = z.input<typeof campFormSchema>;

/**
 * Turn checked inputs into the change the API takes.
 * @param values the inputs
 * @throws {ZodError} when the inputs break the contract's rules
 */
export function campChangeOf(values: CampFormValues): UpdateCampBody {
  return campBasicsSchema.parse({
    ...values,
    contactEditLockDate: values.contactEditLockDate === '' ? null : values.contactEditLockDate,
  });
}

/**
 * Fill the form from the saved Camp.
 * @param camp the Camp
 */
export function campFormValues(camp: Camp): CampFormValues {
  return {
    name: camp.name,
    slug: camp.slug,
    websiteUrl: camp.websiteUrl ?? '',
    description: camp.description ?? '',
    contactName: camp.contactName ?? '',
    contactEmail: camp.contactEmail ?? '',
    contactPhone: camp.contactPhone ?? '',
    modules: camp.modules,
    contactEditLockDate: camp.contactEditLockDate ?? '',
  };
}

// Blank values, only to type the form's parts (`withForm`); the form itself starts from the saved Camp.
const CAMP_FORM_BLANK: CampFormValues = {
  name: '',
  slug: '',
  websiteUrl: '',
  description: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  modules: {
    consents: false,
    documents: false,
    generatedDocuments: false,
    healthRecord: false,
    campHealthLog: false,
    oddily: false,
    vedouci: false,
  },
  contactEditLockDate: '',
};

export const campFormOptions = formOptions({
  defaultValues: CAMP_FORM_BLANK,
  validators: { onChange: campFormSchema },
});
