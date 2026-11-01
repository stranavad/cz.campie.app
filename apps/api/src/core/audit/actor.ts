export const ACTOR_KINDS = ['admin', 'guardian', 'operator', 'system'] as const;

// Who makes a change or views sensitive data. A person acts from an IP address and is named by an
// identity; the system acts on its own (jobs, reminders) and has neither.
export type Actor =
  | {
      readonly kind: Exclude<(typeof ACTOR_KINDS)[number], 'system'>;
      readonly identity: string;
      readonly ipAddress: string;
    }
  | { readonly kind: 'system' };
