// Where a Registration came from: submitted by guardians on the public form, or entered by an admin. Set by
// the API when the Registration is created, never taken from the request.
export const REGISTRATION_SOURCES = ['public', 'admin'] as const;

export type RegistrationSource = (typeof REGISTRATION_SOURCES)[number];
