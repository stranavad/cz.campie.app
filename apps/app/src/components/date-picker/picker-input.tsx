import { useState, type ReactNode, type Ref } from 'react';

import { cn } from '@/lib/utils';

interface PickerInputProps {
  // The field's value as it reads ("15. 6. 2027"), shown while the user is not typing.
  text: string;
  // Called with what was typed when the user leaves the input or presses Enter.
  onCommit: (typed: string) => void;
  // Called after the commit whenever the input loses focus, so a form marks the field visited.
  onBlur?: () => void;
  // The button opening the calendar, at the end of the field.
  trigger: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

// A date typed as text, with the button that opens the calendar inside the same box. The typed text is
// read only once the user is done, so a half-typed date never reaches the form.
export function PickerInput({
  text,
  onCommit,
  onBlur,
  trigger,
  inputRef,
  placeholder,
  id,
  disabled,
  className,
  ...aria
}: PickerInputProps) {
  // What is being typed, until it is committed; null shows the value.
  const [typed, setTyped] = useState<string | null>(null);
  const commit = () => {
    if (typed !== null) {
      setTyped(null);
      onCommit(typed);
    }
  };

  return (
    <div
      data-slot="date-picker"
      className={cn(
        'flex h-12 w-full min-w-0 items-center gap-1 rounded-2xl border border-input bg-input-background pr-0.5 pl-4 transition-[border-color,box-shadow] duration-150 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/25 has-disabled:cursor-not-allowed has-disabled:bg-muted has-disabled:opacity-60 has-aria-invalid:border-2 has-aria-invalid:border-danger-foreground has-aria-invalid:pr-px has-aria-invalid:pl-[15px] has-data-popup-open:border-ring sm:h-11 sm:pr-1',
        className,
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={typed ?? text}
        onChange={(event) => setTyped(event.target.value)}
        onBlur={() => {
          commit();
          onBlur?.();
        }}
        onKeyDown={(event) => {
          // Committed before the form's own Enter submits it.
          if (event.key === 'Enter') {
            commit();
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground tabular-nums outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed"
        {...aria}
      />
      {trigger}
    </div>
  );
}
