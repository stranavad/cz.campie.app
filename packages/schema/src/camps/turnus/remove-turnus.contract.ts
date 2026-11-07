import { defineEndpoint } from '@repo/schema/shared';

import { turnusParamsSchema } from './turnus.resource.ts';

// Why a Turnus cannot be removed: Registrations were submitted to it.
export const REMOVE_TURNUS_ERROR_CODES = ['turnus_has_registrations'] as const;

export type RemoveTurnusErrorCode = (typeof REMOVE_TURNUS_ERROR_CODES)[number];

// Removes a Turnus no Registration was submitted to, audited; Camp settings write.
export const removeTurnusEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/turnusy/:turnusId',
  params: turnusParamsSchema,
});
