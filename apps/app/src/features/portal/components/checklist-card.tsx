import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { ChecklistItem } from '@repo/schema/checklist';
import { czechDate } from '@repo/schema/shared';

import { useGuardianChecklistQuery } from '@/features/portal/api/portal.queries';

// Where a guardian goes to settle an item.
const TARGETS = {
  consent: '/organisation/portal/$registrationId/souhlasy',
  document: '/organisation/portal/$registrationId/dokumenty',
  missing_answers: '/organisation/portal/$registrationId',
} as const;

// What is still open for each child of a Registration, and where to settle it.
export function ChecklistCard({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const checklist = useGuardianChecklistQuery(registrationId);

  if (checklist.data === undefined || checklist.data.participants.length === 0) {
    return null;
  }

  const labelOf = (item: ChecklistItem) => {
    const name = item.label ?? t(`checklist.kinds.${item.kind}`);

    return item.kind === 'missing_answers' ? t('checklist.missingAnswers', { count: item.count ?? 0 }) : name;
  };

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">{t('checklist.title')}</h4>
      {checklist.data.participants.map((participant) => (
        <div key={participant.id} className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            {t('participant', { first: participant.firstName, last: participant.lastName })}
          </span>
          <ul className="flex flex-col gap-1">
            {participant.items.map((item) => (
              <li key={`${item.kind}-${item.key ?? ''}`} className="flex flex-wrap items-center gap-2">
                <span aria-hidden className={item.done ? 'text-primary' : 'text-destructive'}>
                  {item.done ? '✓' : '•'}
                </span>
                {item.kind in TARGETS && !item.done ? (
                  <Link
                    to={TARGETS[item.kind as keyof typeof TARGETS]}
                    params={{ registrationId }}
                    className="underline"
                  >
                    {labelOf(item)}
                  </Link>
                ) : (
                  <span>{labelOf(item)}</span>
                )}
                <span className="text-muted-foreground">
                  {t(`checklist.states.${item.state}`, { defaultValue: '' })}
                </span>
                {item.dueDate === null || item.done ? null : (
                  <span className="text-muted-foreground">
                    {t('checklist.dueBy', { date: czechDate(item.dueDate) })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
