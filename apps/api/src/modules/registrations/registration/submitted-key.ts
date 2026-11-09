import type { RegistrationEntity } from '../../../repositories/registrations/registration/registration.entity.ts';

// A submission's key stands for its guardian only this long after it, while still on the submitted page;
// later, the portal does.
const SUBMITTED_KEY_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Tell whether a submission's key still opens what follows it, the card payment and the Přihlášky: its
 * Registration was submitted less than a day ago and is not Erased.
 * @param registration the Registration the key created, or null for an unknown key
 * @param now the current instant
 */
export function openedBySubmittedKey(
  registration: RegistrationEntity | null,
  now: Date,
): registration is RegistrationEntity {
  return (
    registration !== null &&
    registration.erasedAt === null &&
    now.getTime() - registration.submittedAt.getTime() <= SUBMITTED_KEY_WINDOW_MS
  );
}
