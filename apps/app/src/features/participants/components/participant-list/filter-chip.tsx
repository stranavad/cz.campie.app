import { CheckIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface FilterChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

// One filter of several that can be on together: a pill toggle button.
export function FilterChip({ selected, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-control bg-card px-3.5 text-sm font-medium whitespace-nowrap sm:h-9 text-nav-foreground transition-colors duration-150 outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
    >
      {selected ? <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={3} /> : null}
      {children}
    </button>
  );
}
