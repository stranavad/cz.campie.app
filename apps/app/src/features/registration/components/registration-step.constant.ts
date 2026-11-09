// The form's steps in order; the address numbers them from 1 (`?krok=2`).
export const REGISTRATION_STEPS = ['guardians', 'children', 'questions', 'summary'] as const;

export type RegistrationStep = (typeof REGISTRATION_STEPS)[number];
