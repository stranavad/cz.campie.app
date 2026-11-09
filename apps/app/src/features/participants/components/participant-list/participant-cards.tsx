import { useTranslation } from 'react-i18next';

import type { ParticipantRow } from '@repo/schema/registrations';

import { ParticipantCard } from '@/features/participants/components/participant-list/participant-card';

interface ParticipantCardsProps {
  rows: ParticipantRow[];
}

// The list on a phone: one tappable row per child, the problems as pills under the name.
export function ParticipantCards({ rows }: ParticipantCardsProps) {
  const { t } = useTranslation('participants');

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card md:hidden">
      <ul className="divide-y divide-border-subtle">
        {rows.map((row) => (
          <ParticipantCard key={row.participantId} row={row} />
        ))}
      </ul>
      <p className="border-t border-border-subtle px-4 py-3.5 text-sm text-muted-foreground">
        {t('count', { count: rows.length })}
      </p>
    </div>
  );
}
