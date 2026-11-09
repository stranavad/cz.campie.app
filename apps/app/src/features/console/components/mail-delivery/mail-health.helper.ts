import type { ConsoleOrganisation } from '@repo/schema/console';

/**
 * Bounces and complaints per message sent, from 0 to 1.
 * @param mail an Organisation's mail so far, or the platform's summed
 */
export function bounceRateOf({ sent, bounced, complained }: ConsoleOrganisation['mail']) {
  return sent === 0 ? 0 : (bounced + complained) / sent;
}

/**
 * Whether the mail is above what mail providers act on: a few percent of bounces or a tenth of a percent of
 * complaints, once enough was sent to tell.
 * @param mail an Organisation's mail so far
 */
export function hasMailWarning({ sent, bounced, complained }: ConsoleOrganisation['mail']) {
  return sent >= 50 && (bounced / sent > 0.02 || complained / sent > 0.001);
}
