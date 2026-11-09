// Every action the platform's own audit log records, above any one Organisation: the operator console's
// and the operator command line's. Only the console reads them, as recorded.
export const PLATFORM_AUDIT_ACTIONS = [
  'admin.change_email',
  'admin.change_password',
  'admin.regenerate_recovery_codes',
  'admin.remove',
  'admin.rename',
  'admin.replace_totp',
  'operator.grant',
  'operator.revoke',
  'organisation.approve',
  'organisation.remove',
  'organisation.suspend',
  'organisation.update',
  'totp.reset',
] as const;

export type PlatformAuditAction = (typeof PLATFORM_AUDIT_ACTIONS)[number];
