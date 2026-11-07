// An Organisation's settings sit under one key, per Organisation.
export const organisationSettingsKeys = {
  all: ['organisation-settings'] as const,
  detail: (organisationId: string) => [...organisationSettingsKeys.all, organisationId] as const,
  supportAccess: (organisationId: string) =>
    [...organisationSettingsKeys.detail(organisationId), 'support-access'] as const,
  paymentGateway: (organisationId: string) =>
    [...organisationSettingsKeys.detail(organisationId), 'payment-gateway'] as const,
};
