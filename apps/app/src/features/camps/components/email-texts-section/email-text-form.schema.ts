import { z } from 'zod';

import { campEmailTextBodySchema, unknownPlaceholders, type CampEmailText } from '@repo/schema/emails';

/**
 * Build the form's schema for one email type: the contract's body, with every placeholder the type does
 * not offer reported at its field.
 * @param placeholders the placeholders the type offers
 */
export function emailTextFormSchema(placeholders: readonly string[]) {
  const known = (text: string) => unknownPlaceholders(text, placeholders).length === 0;

  return campEmailTextBodySchema.extend({
    subject: campEmailTextBodySchema.shape.subject.refine(known, 'email_placeholders_unknown'),
    text: campEmailTextBodySchema.shape.text.refine(known, 'email_placeholders_unknown'),
  });
}

export type EmailTextFormValues = z.input<ReturnType<typeof emailTextFormSchema>>;

/**
 * Fill the form from the type's current wording.
 * @param email the type as the Camp has it
 */
export function emailTextFormValues({ subject, text, enabled }: CampEmailText): EmailTextFormValues {
  return { subject, text, enabled };
}
