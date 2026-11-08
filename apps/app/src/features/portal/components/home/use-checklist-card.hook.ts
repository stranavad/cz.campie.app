import { useTranslation } from 'react-i18next';

import type { ChecklistItem } from '@repo/schema/checklist';
import { czechDate } from '@repo/schema/shared';

import { useGuardianChecklistQuery } from '@/features/portal/api/portal.queries';
import { CHECKLIST_TARGETS } from '@/features/portal/components/home/checklist.constants';

export interface ChecklistEntry {
  key: string;
  item: ChecklistItem;
  title: string;
  // Whose it is, its state and its due date, on one line.
  meta: string;
  target: (typeof CHECKLIST_TARGETS)[keyof typeof CHECKLIST_TARGETS] | null;
  tone: 'brand' | 'warning' | 'danger';
}

/**
 * What is still open for each child of a Registration, and what is done, as rows to show.
 * @param registrationId the guardian's Registration
 */
export function useChecklistCard(registrationId: string) {
  const { t } = useTranslation('portal');
  const checklist = useGuardianChecklistQuery(registrationId);
  const titleOf = (item: ChecklistItem) =>
    item.kind === 'missing_answers'
      ? t('checklist.missingAnswers', { count: item.count ?? 0 })
      : (item.label ?? t(`checklist.kinds.${item.kind}`));
  const entries = (checklist.data?.participants ?? []).flatMap((participant) =>
    participant.items.map((item): ChecklistEntry => {
      const state = t(`checklist.states.${item.state}`, { defaultValue: '' });
      const due = item.dueDate === null || item.done ? '' : t('checklist.dueBy', { date: czechDate(item.dueDate) });

      return {
        key: `${participant.id}-${item.kind}-${item.key ?? ''}`,
        item,
        title: item.done
          ? t('checklist.doneOf', { item: titleOf(item), participant: participant.firstName })
          : titleOf(item),
        meta: [participant.firstName, state, due].filter((part) => part !== '').join(' · '),
        target: item.kind in CHECKLIST_TARGETS ? CHECKLIST_TARGETS[item.kind as keyof typeof CHECKLIST_TARGETS] : null,
        tone: item.state === 'returned' ? 'danger' : item.state === 'pending' ? 'warning' : 'brand',
      };
    }),
  );

  return {
    isEmpty: entries.length === 0,
    open: entries.filter(({ item }) => !item.done),
    done: entries.filter(({ item }) => item.done),
  };
}
