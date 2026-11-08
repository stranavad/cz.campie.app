import { Select as SelectPrimitive } from '@base-ui/react/select';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useBrandContainer } from '@/components/ui/brand-portal';
import { controlClassName } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const triggerStyles = cva(
  'group/select flex min-w-0 cursor-pointer items-center justify-between gap-2 text-left select-none disabled:cursor-not-allowed data-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Looks like a text input: a form's choice.
        field: cn(controlClassName, 'h-12 font-normal data-popup-open:border-ring sm:h-11'),
        // A page header's switch (the Selected Turnus).
        pill: 'h-11 max-w-full rounded-full border border-control bg-card px-4 font-semibold transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:bg-muted',
        // A small choice inside a list row.
        chip: 'h-11 shrink-0 rounded-full border border-control bg-card px-3 text-[13px] font-semibold transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 data-popup-open:bg-muted sm:h-9',
        // Text only, such as "switch Camp" above a title.
        bare: 'min-h-8 justify-start gap-1.5 self-start rounded-md text-sm font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:text-foreground',
      },
    },
    defaultVariants: { variant: 'field' },
  },
);

interface SelectOption<V> {
  readonly value: V;
  readonly label: string;
  readonly disabled?: boolean;
}

type SelectProps<V extends string | number> = VariantProps<typeof triggerStyles> & {
  // Null shows the placeholder.
  value: V | null;
  onValueChange: (value: V) => void;
  // Each choice in order.
  options: readonly SelectOption<V>[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  onBlur?: () => void;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  // Drawn in the closed control instead of the chosen option's label: a fixed caption or a shorter name.
  children?: ReactNode;
};

// A choice from a list, drawn and opened by us rather than the browser, so it looks the same on every
// device and in both themes. Keyboard, typeahead and screen readers come from Base UI.
function Select<V extends string | number>({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  name,
  disabled,
  onBlur,
  className,
  variant,
  children,
  ...aria
}: SelectProps<V>) {
  const [trackBrand, brandContainer] = useBrandContainer();

  return (
    <SelectPrimitive.Root
      items={options}
      value={value}
      name={name}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null) {
          onValueChange(next);
        }
      }}
      // Focus moves into the list while it is open, so the field counts as visited once it closes.
      onOpenChange={(open) => {
        if (!open) {
          onBlur?.();
        }
      }}
    >
      <SelectPrimitive.Trigger
        ref={trackBrand}
        id={id}
        data-slot="select"
        className={cn(triggerStyles({ variant }), className)}
        {...aria}
      >
        {children ?? (
          <SelectPrimitive.Value
            placeholder={placeholder}
            className="min-w-0 flex-1 truncate data-placeholder:text-subtle-foreground"
          />
        )}
        <SelectPrimitive.Icon className="flex shrink-0 text-subtle-foreground transition-transform duration-150 group-data-popup-open/select:rotate-180">
          <ChevronDownIcon
            aria-hidden="true"
            className={variant === 'chip' || variant === 'bare' ? 'size-3.5' : 'size-4'}
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={brandContainer}>
        <SelectPrimitive.Positioner
          sideOffset={6}
          align="start"
          alignItemWithTrigger={false}
          className="z-50 outline-none"
        >
          <SelectPrimitive.Popup className="min-w-(--anchor-width) origin-(--transform-origin) rounded-2xl border border-border bg-card text-foreground shadow-float outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <SelectPrimitive.List className="max-h-[min(var(--available-height),22rem)] max-w-[calc(100vw-2rem)] scroll-py-1.5 overflow-y-auto p-1.5">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[15px] text-foreground outline-none select-none data-disabled:cursor-not-allowed data-disabled:opacity-45 data-highlighted:bg-muted data-selected:font-semibold sm:min-h-9"
                >
                  <SelectPrimitive.ItemText className="min-w-0 flex-1">{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="flex shrink-0">
                    <CheckIcon aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select, type SelectOption };
