import type { ConsoleOrganisation, MailCounts } from '@repo/schema/console';

/**
 * Bounces and complaints per message sent, from 0 to 1.
 * @param mail an Organisation's mail, or the platform's summed
 */
export function bounceRateOf({ sent, bounced, complained }: MailCounts) {
  return sent === 0 ? 0 : (bounced + complained) / sent;
}

/**
 * Whether an Organisation's mail of the last 7 days, by which mail providers judge a sender now, is above
 * what they act on: a few percent of bounces or a tenth of a percent of complaints, once enough was sent to
 * tell.
 * @param mail an Organisation's mail
 */
export function hasMailWarning({ lastSevenDays: { sent, bounced, complained } }: ConsoleOrganisation['mail']) {
  return sent >= 50 && (bounced / sent > 0.02 || complained / sent > 0.001);
}
