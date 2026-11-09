import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate } from '@repo/schema/shared';

/**
 * How a Registration is introduced: its children by first name, cancelled ones apart, and where and when.
 * @param registration the guardian's Registration
 */
export function useRegistrationSummary(registration: GuardianRegistration) {
  const { t, i18n } = useTranslation('portal');
  const { camp, turnus, participants } = registration;
  const list = new Intl.ListFormat(i18n.language, { type: 'conjunction' });
  const namesOf = (of: typeof participants) => list.format(of.map(({ firstName }) => firstName));
  const active = participants.filter(({ status }) => status !== 'cancelled');
  const cancelled = participants.filter(({ status }) => status === 'cancelled');
  const dates = t('dates', { start: czechDate(turnus.startDate), end: czechDate(turnus.endDate) });

  return {
    // With every child cancelled, the heading still names them, and says so below.
    title: namesOf(active.length === 0 ? cancelled : active),
    where: [camp.name, turnus.name, turnus.place === '' ? dates : t('datesAt', { dates, place: turnus.place })]
      .filter((part) => part !== '')
      .join(' · '),
    cancelledNote:
      cancelled.length === 0
        ? null
        : active.length === 0
          ? t('allCancelled')
          : t('cancelled', { names: namesOf(cancelled) }),
  };
}
