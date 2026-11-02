import { formOptions } from '@tanstack/react-form';
import type { z } from 'zod';

import { createInvitationBodySchema } from '@repo/schema/admins';

// The contract's own: the API decides the rest, such as an address that is already a member.
export const inviteFormSchema = createInvitationBodySchema;

export type InviteFormValues = z.input<typeof inviteFormSchema>;

const INVITE_FORM_DEFAULTS: InviteFormValues = {
  email: '',
  permissions: { registrations: 'none', campSettings: 'none', health: 'none', oddily: 'none', vedouci: 'none' },
};

export const inviteFormOptions = formOptions({
  defaultValues: INVITE_FORM_DEFAULTS,
  validators: { onChange: inviteFormSchema },
});
