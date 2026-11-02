import { z } from 'zod';

// The six digits an authenticator app shows.
export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'totp_code_malformed');

// What an authenticator app needs to start showing codes: the otpauth URI, and its secret for typing in.
export const totpEnrolmentSchema = z.object({
  secret: z.string(),
  uri: z.string(),
});

export type TotpEnrolment = z.infer<typeof totpEnrolmentSchema>;

// Codes of a refused step of setting up or entering a TOTP code, which the app translates.
export const TOTP_ERROR_CODES = [
  'totp_enabled',
  'totp_not_started',
  'totp_not_enabled',
  'totp_code_invalid',
  'totp_throttled',
] as const;

export type TotpErrorCode = (typeof TOTP_ERROR_CODES)[number];
