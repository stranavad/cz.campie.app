// An Organisation's settings sit under one key, per Organisation.
export const organisationSettingsKeys = {
  all: ['organisation-settings'] as const,
  detail: (organisationId: string) => [...organisationSettingsKeys.all, organisationId] as const,
  paymentGateway: (organisationId: string) =>
    [...organisationSettingsKeys.detail(organisationId), 'payment-gateway'] as const,
};
