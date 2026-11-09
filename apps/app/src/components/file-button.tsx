import { UploadIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { buttonVariants, type ButtonVariantProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FileButtonProps = ButtonVariantProps & {
  label: string;
  disabled?: boolean;
  // Accepted types, as for the input's `accept`.
  accept: string;
  onFile: (file: File) => void;
  // The id of a hint about types and size.
  describedBy?: string;
  // Opens the phone's camera straight away, as the input's `capture`.
  capture?: 'environment' | 'user';
  // In place of the upload arrow.
  icon?: ReactNode;
  className?: string;
};

// A file picker that looks like a button: the native input, hidden, inside its label, so phones offer the
// camera and keyboards still reach it. The input is cleared after each pick, so the same file can be
// picked again.
export function FileButton({
  label,
  disabled = false,
  accept,
  onFile,
  describedBy,
  capture,
  icon = <UploadIcon aria-hidden="true" />,
  variant = 'outline',
  size,
  className,
}: FileButtonProps) {
  return (
    <label
      className={buttonVariants({
        variant,
        size,
        className: cn(
          'cursor-pointer has-disabled:pointer-events-none has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
          className,
        ),
      })}
    >
      {icon}
      {label}
      <input
        type="file"
        accept={accept}
        capture={capture}
        aria-describedby={describedBy}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file !== undefined) {
            onFile(file);
          }

          event.target.value = '';
        }}
      />
    </label>
  );
}
