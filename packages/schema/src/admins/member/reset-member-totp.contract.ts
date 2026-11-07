import { defineEndpoint } from '@repo/schema/shared';

import { removeMemberParamsSchema } from './remove-member.contract.ts';

// Codes of a refused reset, which the app translates: the admin is the Platform operator or a member of
// another Organisation, whose reset is the operator's to do from the console.
export const MEMBER_TOTP_RESET_ERROR_CODES = ['totp_reset_elsewhere'] as const;

export type MemberTotpResetErrorCode = (typeof MEMBER_TOTP_RESET_ERROR_CODES)[number];

// Turns a member's two-step login off, as when they lost their phone, so they set it up again, and ends
// their sessions; audited and emailed to them. Owners only.
export const resetMemberTotpEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/members/:memberId/totp',
  params: removeMemberParamsSchema,
});
