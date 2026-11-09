import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CHECK_FILTERS, type CheckFilter } from '@/features/participants/components/participants-search.constant';

interface CheckFiltersProps {
  checks: readonly CheckFilter[];
  onToggle: (check: CheckFilter) => void;
}

// The checklist as one quieter pill ("Kontrola: vše"), opening checkboxes that narrow the list together.
export function CheckFilters({ checks, onToggle }: CheckFiltersProps) {
  const { t } = useTranslation('participants');
  const [only] = checks;
  const chosen =
    only === undefined
      ? t('filters.any')
      : checks.length === 1
        ? t(`filters.${only}`)
        : t('filters.chosen', { count: checks.length });

  return (
    <Popover>
      <PopoverTrigger className="group/filters flex h-11 max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-full border border-control bg-card px-4 font-semibold transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:bg-muted">
        <span className="min-w-0 truncate">
          {t('filterPill.caption', { ns: 'common', label: t('filters.label'), value: chosen })}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-subtle-foreground transition-transform duration-150 group-data-popup-open/filters:rotate-180"
        />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col p-1.5">
        {CHECK_FILTERS.map((check) => (
          <label
            key={check}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[15px] hover:bg-muted sm:min-h-9"
          >
            <Checkbox checked={checks.includes(check)} onCheckedChange={() => onToggle(check)} />
            {t(`filters.${check}`)}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
