import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChecklistRow } from '@/features/portal/components/home/checklist-row';
import { useChecklistCard } from '@/features/portal/components/home/use-checklist-card.hook';

// What is still open for each child of a Registration, and where to settle it; what is done, as chips.
export function ChecklistCard({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const { isEmpty, open, done } = useChecklistCard(registrationId);

  if (isEmpty) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2.5 pt-2">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 className="text-heading">{t('checklist.title')}</h3>
        <span className="text-sm text-muted-foreground">
          {open.length === 0 ? t('checklist.allDone') : t('checklist.count', { count: open.length })}
        </span>
      </div>
      {open.length === 0 ? null : (
        <ul className="flex flex-col gap-2.5">
          {open.map((entry) => (
            <ChecklistRow key={entry.key} entry={entry} registrationId={registrationId} />
          ))}
        </ul>
      )}
      {done.length === 0 ? null : (
        <div className="flex flex-col gap-2 px-1 pt-2">
          <h4 className="text-sm font-bold text-muted-foreground">{t('checklist.done')}</h4>
          <ul className="flex flex-wrap gap-2">
            {done.map((entry) => (
              <li
                key={entry.key}
                className="inline-flex min-h-8.5 items-center gap-1.5 rounded-full bg-success px-3 py-1 text-sm font-semibold text-success-foreground"
              >
                <CheckIcon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={3} />
                {entry.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
