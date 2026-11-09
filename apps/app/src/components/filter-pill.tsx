import { useTranslation } from 'react-i18next';

import { Select, type SelectOption } from '@/components/ui/select';

interface FilterPillProps<V extends string | number> {
  // What the filter narrows by ("Kdo"), shown before the chosen option's label.
  label: string;
  value: V;
  onValueChange: (value: V) => void;
  options: readonly SelectOption<V>[];
}

// A list filter as a pill reading "Kdo: všichni", opening its options in our Select popup. A filter whose
// options name themselves ("Posledních 30 dní") is a plain `<Select variant="pill">`.
export function FilterPill<V extends string | number>({ label, value, onValueChange, options }: FilterPillProps<V>) {
  const { t } = useTranslation();
  const chosen = options.find((option) => option.value === value)?.label ?? '';

  return (
    <Select variant="pill" aria-label={label} value={value} onValueChange={onValueChange} options={options}>
      <span className="min-w-0 truncate">{t('filterPill.caption', { label, value: chosen })}</span>
    </Select>
  );
}
