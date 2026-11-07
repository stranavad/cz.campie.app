import { defineEndpoint } from '@repo/schema/shared';

import { turnusBodySchema } from './turnus-body.ts';
import { turnusParamsSchema, turnusSchema } from './turnus.resource.ts';

// Replaces a Turnus's fields with the whole Turnus as the form holds it, so its rules are checked on the
// result; audited, Camp settings write. Stored prices of existing Registrations never change with it.
export const updateTurnusEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/turnusy/:turnusId',
  params: turnusParamsSchema,
  body: turnusBodySchema,
  response: turnusSchema,
});
