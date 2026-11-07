import { defineEndpoint } from '@repo/schema/shared';

import { registrationParamsSchema } from '../ledger/ledger.resource.ts';

// `registration_erased`: the Registration was erased already.
export const ERASURE_ERROR_CODES = ['registration_erased'] as const;

export type ErasureErrorCode = (typeof ERASURE_ERROR_CODES)[number];

// Erases a Registration to an accounting tombstone: its Registered children cancelled, every stored file and
// all personal data deleted, the Turnus, Variable symbol, price lines, Price adjustments (notes blanked) and
// payment ledger kept, and its audit entries scrubbed; cannot be undone; audited; Owners only.
export const eraseRegistrationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/erase',
  params: registrationParamsSchema,
});
