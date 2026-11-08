import { useTranslation } from 'react-i18next';

import type { Turnus } from '@repo/schema/camps';
import { czechDate, czk } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { turnusAgesOf } from '@/features/camps/components/turnus-section/turnus-ages.helper';
import { cn } from '@/lib/utils';

interface TurnusRowProps {
  turnus: Turnus;
  canWrite: boolean;
  isEditing: boolean;
  onEdit: () => void;
}

const AVAILABILITY_VARIANTS = {
  open: 'success',
  not_yet_open: 'outline',
  full: 'neutral',
  closed_manually: 'neutral',
  closed_by_window: 'neutral',
} as const;

// One Turnus as a card: when and for whom, how full, the price and whether it takes Registrations. Its
// name opens it in the editor; the whole card is the target.
export function TurnusRow({ turnus, canWrite, isEditing, onEdit }: TurnusRowProps) {
  const { t } = useTranslation('camps');
  const ages = turnusAgesOf(t, turnus);
  const places = t('turnus.places', { registered: turnus.registered, capacity: turnus.capacity });

  return (
    <li
      className={cn(
        'relative flex flex-wrap items-center gap-x-6 gap-y-3.5 rounded-3xl border border-border bg-card px-5 py-5 transition-colors sm:px-5.5',
        canWrite && 'hover:border-control',
        isEditing && 'border-foreground ring-1 ring-foreground hover:border-foreground',
      )}
    >
      <div className="flex min-w-0 flex-[2_1_12rem] flex-col leading-snug">
        {canWrite ? (
          <button
            type="button"
            aria-current={isEditing ? 'true' : undefined}
            onClick={onEdit}
            className="cursor-pointer self-start text-left font-display text-xl font-bold outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {turnus.name}
          </button>
        ) : (
          <h3 className="font-display text-xl font-bold">{turnus.name}</h3>
        )}
        <span className="text-muted-foreground">
          {[t('turnus.dates', { start: czechDate(turnus.startDate), end: czechDate(turnus.endDate) }), ages]
            .filter((part) => part !== null)
            .join(' · ')}
        </span>
        <span className="text-[13px] text-muted-foreground">{turnus.place}</span>
      </div>
      <div className="flex min-w-0 flex-[1_1_10rem] flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">{places}</span>
        <Progress value={turnus.capacity === 0 ? 0 : turnus.registered / turnus.capacity} label={places} />
      </div>
      <div className="flex min-w-0 flex-[1_1_7.5rem] flex-col leading-snug">
        <span className="font-bold">{czk(turnus.basePrice)}</span>
        <span className="text-[13px] text-muted-foreground">
          {turnus.deposit === null || turnus.deposit === 0
            ? t('turnus.noDeposit')
            : t('turnus.deposit', { amount: czk(turnus.deposit) })}
        </span>
      </div>
      <Badge variant={AVAILABILITY_VARIANTS[turnus.availability]}>
        {t(`turnus.availability.${turnus.availability}`)}
      </Badge>
    </li>
  );
}
