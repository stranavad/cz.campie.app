import { z } from 'zod';

import { defineEndpoint, passwordSchema } from '@repo/schema/shared';

export const changePasswordBodySchema = z.object({
  // Checked like a login and counted against its limit; the strength rules applied when it was set.
  currentPassword: z.string().min(1).max(200),
  password: passwordSchema,
});

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;

// Changes the signed-in admin's password with their current one, ends every other session of theirs and
// emails them a notice. With two-step login on, only a session that passed it. Audited in the platform's
// log as the fact only. A wrong current password answers current_password_invalid, too many login_throttled,
// a weak new one a password code.
export const changePasswordEndpoint = defineEndpoint({
  method: 'POST',
  path: '/account/password',
  body: changePasswordBodySchema,
});
