import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { useRecentRegistrationsQuery } from '@/core/participant-list';

// The Organisation's newest Registrations, each with its children's names and where and when it came in.
export function useRecentRegistrations(organisationId: string) {
  const { t } = useTranslation('adminHome');
  const recent = useRecentRegistrationsQuery(organisationId);
  const names = new Intl.ListFormat('cs', { type: 'conjunction' });

  return {
    isPending: recent.isPending,
    isError: recent.isError,
    rows: (recent.data ?? []).map((registration) => ({
      id: registration.id,
      names: names.format(
        registration.participants.map(({ firstName, lastName }) =>
          t('recent.participant', { first: firstName, last: lastName }),
        ),
      ),
      detail: t('recent.detail', {
        camp: registration.camp.name,
        turnus: registration.turnus.name,
        date: czechDateTime(registration.submittedAt),
      }),
      source: t(`recent.source.${registration.source}`),
      paymentStatus: registration.paymentStatus,
    })),
  };
}
