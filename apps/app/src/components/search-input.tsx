import { SearchIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

// A pill search box with a leading magnifier, beside a list's filters. Named "Hledat" unless an aria-label
// says more; the placeholder says what it searches.
export function SearchInput({ className, ...props }: SearchInputProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('relative min-w-0', className)}>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-subtle-foreground"
      />
      <Input
        type="search"
        aria-label={t('searchInput.label')}
        className="h-11 rounded-full border-control bg-card pl-11"
        {...props}
      />
    </div>
  );
}
