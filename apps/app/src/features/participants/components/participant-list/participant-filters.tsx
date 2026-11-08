import { SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PAYMENT_STATUSES, type PaymentStatus } from '@repo/schema/pricing';

import { Input } from '@/components/ui/input';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { FilterChip } from '@/features/participants/components/participant-list/filter-chip';
import type { ParticipantFlag } from '@/features/participants/components/use-participants-page.hook';

interface ParticipantFiltersProps {
  search: string;
  onSearch: (search: string) => void;
  paymentStatus: PaymentStatus | '';
  onPaymentStatus: (status: PaymentStatus | '') => void;
  flags: Record<ParticipantFlag, boolean>;
  onToggleFlag: (flag: ParticipantFlag) => void;
}

const FLAGS = [
  'overdue',
  'unsignedConsent',
  'missingDocument',
  'missingAnswers',
  'unverified',
] as const satisfies readonly ParticipantFlag[];

// The payment status as one choice, the search, and the checklist filters that each narrow the list.
export function ParticipantFilters(props: ParticipantFiltersProps) {
  const { t } = useTranslation('participants');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl aria-label={t('paymentStatus')}>
          <SegmentedControlItem selected={props.paymentStatus === ''} onClick={() => props.onPaymentStatus('')}>
            {t('anyStatus')}
          </SegmentedControlItem>
          {PAYMENT_STATUSES.map((status) => (
            <SegmentedControlItem
              key={status}
              selected={props.paymentStatus === status}
              onClick={() => props.onPaymentStatus(status)}
            >
              {t(`status.${status}`)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <div className="relative w-full sm:ml-auto sm:w-80">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-subtle-foreground"
          />
          <Input
            type="search"
            aria-label={t('search')}
            placeholder={t('search')}
            className="rounded-full pl-11"
            value={props.search}
            onChange={(event) => props.onSearch(event.target.value)}
          />
        </div>
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t('filters.label')}</legend>
        {FLAGS.map((flag) => (
          <FilterChip key={flag} selected={props.flags[flag]} onClick={() => props.onToggleFlag(flag)}>
            {t(`filters.${flag}`)}
          </FilterChip>
        ))}
      </fieldset>
    </div>
  );
}
