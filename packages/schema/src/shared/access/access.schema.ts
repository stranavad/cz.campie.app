// Headers the app sends with its API requests, lowercase as Node reads them.
export const ACCESS_HEADERS = {
  // Required on every mutating request. A cross-site page cannot add a custom header without a CORS
  // preflight, which the API never answers, so its forged requests arrive without it.
  csrf: 'x-csrf-protection',
  // The Organisation an admin request acts in, checked against the admin's memberships.
  organisation: 'x-organisation-id',
} as const;

// Codes of a request refused before it reaches its route, which the app translates. A suspended
// Organisation's subdomain answers organisation_suspended; the console answers not_operator to anyone but
// the Platform operator, and second_factor_required to a session without a TOTP code.
export const ACCESS_ERROR_CODES = [
  'csrf_header_missing',
  'organisation_unknown',
  'organisation_suspended',
  'permission_denied',
  'not_operator',
  'second_factor_required',
  // The Platform operator under a read-only support grant tried a change.
  'support_read_only',
] as const;

export type AccessErrorCode = (typeof ACCESS_ERROR_CODES)[number];
