import type { ReactNode } from 'react';

interface ChoiceTileProps {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}

// A native radio in a large, tappable tile.
export function ChoiceTile({ name, checked, onChange, children }: ChoiceTileProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border border-input px-3.5 font-semibold transition-colors has-checked:border-foreground has-checked:bg-brand-soft">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-4.5 accent-primary" />
      {children}
    </label>
  );
}
