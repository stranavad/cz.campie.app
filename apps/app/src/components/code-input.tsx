import { OTPField } from '@base-ui/react/otp-field';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const LENGTH = 6;

interface CodeInputProps {
  // The first box's id: a `<label htmlFor>` with it names the whole group.
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  // Called once focus leaves all six boxes.
  onBlur?: () => void;
  'aria-invalid'?: boolean;
  className?: string;
}

// Six single-digit boxes for an authenticator code. Base UI moves focus on typing and Backspace, spreads a
// pasted or autofilled code (one-time-code) over the boxes, and labels them as one group.
export function CodeInput({ id, value, onValueChange, onBlur, className, 'aria-invalid': invalid }: CodeInputProps) {
  const { t } = useTranslation();

  return (
    <OTPField.Root
      id={id}
      length={LENGTH}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onBlur?.();
        }
      }}
      className={cn('grid grid-cols-6 gap-1.5', className)}
    >
      {Array.from({ length: LENGTH }, (_, index) => (
        <OTPField.Input
          key={index}
          // The first box is named by the label; the others say where they are.
          aria-label={index === 0 ? undefined : t('codeInput.digit', { position: index + 1, length: LENGTH })}
          aria-invalid={invalid}
          className="h-14 w-full min-w-0 rounded-[14px] border border-input bg-input-background text-center text-[22px] font-bold text-foreground tabular-nums transition-colors duration-150 outline-none focus:border-2 focus:border-foreground aria-invalid:border-2 aria-invalid:border-danger-foreground"
        />
      ))}
    </OTPField.Root>
  );
}
