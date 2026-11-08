import { UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import { controlClassName } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FileInputProps {
  // The hidden input's id, for a field label.
  id?: string;
  // Accepted types, as for the input's `accept`.
  accept: string;
  disabled?: boolean;
  onFile: (file: File) => void;
  'aria-describedby'?: string;
  className?: string;
}

// A file field drawn like our inputs: a "pick a file" pill and the uploading file's name, in Czech, instead of
// the browser's own button and text. The native input stays inside, hidden, so phones offer the camera and
// keyboards still reach it.
export function FileInput({ id, accept, disabled, onFile, className, ...aria }: FileInputProps) {
  const { t } = useTranslation();
  const [name, setName] = useState<string | null>(null);
  const shown = disabled === true ? name : null;

  return (
    <label
      data-slot="file-input"
      className={cn(
        controlClassName,
        'flex h-12 cursor-pointer items-center gap-3 pl-1.5 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/25 has-disabled:cursor-not-allowed has-disabled:bg-muted has-disabled:opacity-60 sm:h-11',
        className,
      )}
    >
      <span
        className={buttonVariants({
          variant: 'secondary',
          size: 'sm',
          className: 'pointer-events-none h-9 sm:h-8',
        })}
      >
        <UploadIcon aria-hidden="true" />
        {t('fileInput.pick')}
      </span>
      {/* The picked file's name shows while it uploads; once done the field gives way to the attached file,
          and after a failure nothing is attached, so it reads "no file" again. */}
      <span className={cn('min-w-0 truncate text-[15px]', shown === null && 'text-subtle-foreground')}>
        {shown ?? t('fileInput.none')}
      </span>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file !== undefined) {
            setName(file.name);
            onFile(file);
          }

          // Cleared, so the same file can be picked again after a failed upload.
          event.target.value = '';
        }}
        {...aria}
      />
    </label>
  );
}
