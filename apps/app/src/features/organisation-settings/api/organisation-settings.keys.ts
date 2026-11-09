// An Organisation's settings sit under one key, per Organisation.
export const organisationSettingsKeys = {
  all: ['organisation-settings'] as const,
  detail: (organisationId: string) => [...organisationSettingsKeys.all, organisationId] as const,
  supportAccess: (organisationId: string) =>
    [...organisationSettingsKeys.detail(organisationId), 'support-access'] as const,
  // Who of the team still logs in without a TOTP code, beside the switch that requires it.
  members: (organisationId: string) => [...organisationSettingsKeys.detail(organisationId), 'members'] as const,
  paymentGateway: (organisationId: string) =>
    [...organisationSettingsKeys.detail(organisationId), 'payment-gateway'] as const,
};
