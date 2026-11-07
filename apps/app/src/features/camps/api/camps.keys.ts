// Everything about an Organisation's Camps sits under one key, per Organisation.
export const campsKeys = {
  all: ['camps'] as const,
  organisation: (organisationId: string) => [...campsKeys.all, organisationId] as const,
  list: (organisationId: string) => [...campsKeys.organisation(organisationId), 'list'] as const,
  detail: (organisationId: string, campId: string) => [...campsKeys.organisation(organisationId), campId] as const,
  preview: (organisationId: string, campId: string) =>
    [...campsKeys.detail(organisationId, campId), 'preview'] as const,
  emailTexts: (organisationId: string, campId: string) =>
    [...campsKeys.detail(organisationId, campId), 'email-texts'] as const,
  registrationForm: (organisationId: string, campId: string) =>
    [...campsKeys.detail(organisationId, campId), 'registration-form'] as const,
  discountCodes: (organisationId: string, campId: string) =>
    [...campsKeys.detail(organisationId, campId), 'discount-codes'] as const,
  turnusy: (organisationId: string, campId: string) =>
    [...campsKeys.detail(organisationId, campId), 'turnusy'] as const,
  branding: (organisationId: string, campId: string) =>
    [...campsKeys.detail(organisationId, campId), 'branding'] as const,
};
