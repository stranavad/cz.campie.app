import { useTranslation } from 'react-i18next';

import { FilterPill } from '@/components/filter-pill';
import { SearchInput } from '@/components/search-input';
import { SegmentedControl, SegmentedControlCount, SegmentedControlItem } from '@/components/ui/segmented-control';
import {
  CHECK_FILTERS,
  type CheckFilter,
  type PaymentTab,
} from '@/features/participants/schemas/participants-search.schema';
import { cn } from '@/lib/utils';

interface ParticipantFiltersProps {
  text: string;
  onText: (text: string) => void;
  tab: PaymentTab;
  onTab: (tab: PaymentTab) => void;
  // Undefined while the Turnus loads.
  countOf: (tab: PaymentTab) => number | undefined;
  check: CheckFilter | null;
  onCheck: (check: CheckFilter | null) => void;
}

// In the design's order; a rare status shows only when someone has it.
const TABS = [
  'all',
  'paid',
  'overpaid',
  'deposit_paid',
  'partly_paid',
  'unpaid',
  'overdue',
] as const satisfies readonly PaymentTab[];
const RARE: readonly PaymentTab[] = ['overpaid', 'deposit_paid'];

// The payment status as tabs with counts, the search, and the checklist as one quieter filter.
export function ParticipantFilters(props: ParticipantFiltersProps) {
  const { t } = useTranslation('participants');
  const shown = TABS.filter((tab) => !RARE.includes(tab) || tab === props.tab || (props.countOf(tab) ?? 0) > 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl aria-label={t('paymentStatus')}>
        {shown.map((tab) => {
          const count = props.countOf(tab);

          return (
            <SegmentedControlItem
              key={tab}
              selected={props.tab === tab}
              onClick={() => props.onTab(tab)}
              className={cn(tab === 'overdue' && (count ?? 0) > 0 && 'text-danger-foreground')}
            >
              {t(`tabs.${tab}`)}
              {count === undefined ? null : <SegmentedControlCount>{count}</SegmentedControlCount>}
            </SegmentedControlItem>
          );
        })}
      </SegmentedControl>
      <FilterPill
        label={t('filters.label')}
        value={props.check ?? 'any'}
        onValueChange={(value) => props.onCheck(value === 'any' ? null : value)}
        options={[
          { value: 'any', label: t('filters.any') },
          ...CHECK_FILTERS.map((check) => ({ value: check, label: t(`filters.${check}`) })),
        ]}
      />
      <SearchInput
        className="w-full sm:ml-auto sm:w-80"
        placeholder={t('search')}
        value={props.text}
        onChange={(event) => props.onText(event.target.value)}
      />
    </div>
  );
}
