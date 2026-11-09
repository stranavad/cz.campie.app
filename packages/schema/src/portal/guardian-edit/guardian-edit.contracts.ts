import { defineEndpoint } from '@repo/schema/shared';

import { guardianRegistrationParamsSchema } from '../guardian-registration/guardian-registration.resource.ts';
import {
  addGuardianBodySchema,
  answerNewFieldsBodySchema,
  confirmGuardianEmailChangeBodySchema,
  confirmGuardianEmailChangeResponseSchema,
  guardianContactBodySchema,
  guardianEditSchema,
  guardianEmailChangeBodySchema,
  guardianPositionParamsSchema,
} from './guardian-edit.resource.ts';

// What the signed-in guardian may change on one of their Registrations.
export const getGuardianEditEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations/:registrationId/edit',
  params: guardianRegistrationParamsSchema,
  response: guardianEditSchema,
});

// Changes a guardian's name and phone until the lock date; audited.
export const updateGuardianContactEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/portal/registrations/:registrationId/guardians/:position',
  params: guardianPositionParamsSchema,
  body: guardianContactBodySchema,
  response: guardianEditSchema,
});

// Adds a second guardian until the lock date, who gets access at once and an email with a login link;
// audited.
export const addGuardianEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/registrations/:registrationId/guardians',
  params: guardianRegistrationParamsSchema,
  body: addGuardianBodySchema,
  response: guardianEditSchema,
});

// Asks to change a guardian's email until the lock date: the new address gets a link, and only following it
// makes the change.
export const requestGuardianEmailChangeEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/registrations/:registrationId/guardians/:position/email-change',
  params: guardianPositionParamsSchema,
  body: guardianEmailChangeBodySchema,
});

// Follows an email change's link, once, without a session: the guardian's email changes, and the old address
// is told; audited. Answers the new address, for the page to say which one was confirmed.
export const confirmGuardianEmailChangeEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/email-changes/confirm',
  body: confirmGuardianEmailChangeBodySchema,
  response: confirmGuardianEmailChangeResponseSchema,
  status: 200,
});

// Answers fields added to the form after the Registration was submitted, until the lock date. The first
// answer to a field with a surcharge adds its price line, frozen; changing it later is an admin's. Audited.
export const answerNewFieldsEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/portal/registrations/:registrationId/answers',
  params: guardianRegistrationParamsSchema,
  body: answerNewFieldsBodySchema,
  response: guardianEditSchema,
});
