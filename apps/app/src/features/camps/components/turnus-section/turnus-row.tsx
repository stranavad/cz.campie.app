import { useTranslation } from 'react-i18next';

import type { Turnus } from '@repo/schema/camps';

import { Button } from '@/components/ui/button';

interface TurnusRowProps {
  turnus: Turnus;
  canWrite: boolean;
  isConfirmingRemoval: boolean;
  isRemoving: boolean;
  onEdit: () => void;
  onAskToRemove: () => void;
  onRemove: () => void;
  onCancelRemoval: () => void;
}

/**
 * Write a calendar date as Czech readers write it.
 * @param date YYYY-MM-DD
 */
function czechDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  return `${day}. ${month}. ${year}`;
}

export function TurnusRow({ turnus, canWrite, isConfirmingRemoval, isRemoving, ...actions }: TurnusRowProps) {
  const { t } = useTranslation('camps');

  return (
    <li className="flex flex-col gap-2 border-b border-border py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-medium">{turnus.name}</span>
        <span className="text-sm text-muted-foreground">
          {t('turnus.dates', { start: czechDate(turnus.startDate), end: czechDate(turnus.endDate) })}
        </span>
        <span className="text-sm">
          {t('turnus.places', { registered: turnus.registered, capacity: turnus.capacity })}
        </span>
        <span className="text-sm">{t(`turnus.availability.${turnus.availability}`)}</span>
      </div>
      {canWrite ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={actions.onEdit}>
            {t('turnus.edit')}
          </Button>
          {isConfirmingRemoval ? (
            <>
              <Button variant="destructive" size="sm" disabled={isRemoving} onClick={actions.onRemove}>
                {t('turnus.confirmRemove')}
              </Button>
              <Button variant="ghost" size="sm" onClick={actions.onCancelRemoval}>
                {t('turnus.cancel')}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={actions.onAskToRemove}>
              {t('turnus.remove')}
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}
