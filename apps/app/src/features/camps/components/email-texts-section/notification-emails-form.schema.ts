import { z } from 'zod';

import { campFieldsSchema, type Camp, type UpdateCampBody } from '@repo/schema/camps';

/**
 * Read typed recipients, one per line, blank lines skipped.
 * @param text the input's text
 */
function emailsOf(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

// The team's recipients are typed one per line and checked as the contract's list.
export const notificationEmailsFormSchema = z.object({
  notificationEmails: z
    .string()
    .refine(
      (text) => campFieldsSchema.shape.notificationEmails.safeParse(emailsOf(text)).success,
      'notification_emails_invalid',
    ),
});

export type NotificationEmailsFormValues = z.input<typeof notificationEmailsFormSchema>;

/**
 * Turn checked inputs into the change the API takes.
 * @param values the inputs
 * @throws {ZodError} when the inputs break the contract's rules
 */
export function notificationEmailsChangeOf(values: NotificationEmailsFormValues): UpdateCampBody {
  return { notificationEmails: campFieldsSchema.shape.notificationEmails.parse(emailsOf(values.notificationEmails)) };
}

/**
 * Fill the form from the saved Camp.
 * @param camp the Camp
 */
export function notificationEmailsFormValues(camp: Camp): NotificationEmailsFormValues {
  return { notificationEmails: camp.notificationEmails.join('\n') };
}
