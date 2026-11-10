import { useTranslation } from 'react-i18next';

import { SearchInput } from '@/components/search-input';
import { SegmentedControl, SegmentedControlCount, SegmentedControlItem } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { CheckFilters } from '@/features/participants/components/participant-list/check-filters';
import {
  INVOICE_TABS,
  type CheckFilter,
  type InvoiceTab,
  type PaymentTab,
} from '@/features/participants/components/participants-search.constant';
import { cn } from '@/lib/utils';

interface ParticipantFiltersProps {
  text: string;
  onText: (text: string) => void;
  tab: PaymentTab;
  onTab: (tab: PaymentTab) => void;
  // Undefined while the Turnus loads.
  countOf: (tab: PaymentTab) => number | undefined;
  checks: readonly CheckFilter[];
  onToggleCheck: (check: CheckFilter) => void;
  invoice: InvoiceTab;
  onInvoice: (invoice: InvoiceTab) => void;
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

// The payment status as tabs with counts, the search, and the checklist filters on top of the tab.
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
      <CheckFilters checks={props.checks} onToggle={props.onToggleCheck} />
      <Select
        variant="chip"
        aria-label={t('invoiceFilter.label')}
        value={props.invoice}
        onValueChange={props.onInvoice}
        options={INVOICE_TABS.map((value) => ({ value, label: t(`invoiceFilter.${value}`) }))}
      >
        {t('invoiceFilter.chosen', { value: t(`invoiceFilter.${props.invoice}`) })}
      </Select>
      <SearchInput
        className="w-full sm:ml-auto sm:w-80"
        placeholder={t('search')}
        value={props.text}
        onChange={(event) => props.onText(event.target.value)}
      />
    </div>
  );
}
