// The period pill: the whole log, the last days counted with today, or a range from the date pickers.
export const AUDIT_LOG_PERIODS = ['all', '7', '30', '90', 'custom'] as const;

export type AuditLogPeriod = (typeof AUDIT_LOG_PERIODS)[number];
