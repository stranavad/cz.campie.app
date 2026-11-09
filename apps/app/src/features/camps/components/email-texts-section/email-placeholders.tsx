import { useTranslation } from 'react-i18next';

interface EmailPlaceholdersProps {
  // As written into the subject or text: {{name}}.
  placeholders: readonly string[];
  // Puts one where the cursor was in the subject or the text.
  onInsert: (placeholder: string) => void;
}

// The data an email type can fill in, as chips that insert themselves at the cursor.
export function EmailPlaceholders({ placeholders, onInsert }: EmailPlaceholdersProps) {
  const { t } = useTranslation('camps');

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{t('emails.placeholders')}</legend>
      <div className="flex flex-wrap gap-1.5">
        {placeholders.map((placeholder) => (
          <button
            key={placeholder}
            type="button"
            // Kept from taking focus, so the cursor stays where the placeholder goes.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onInsert(placeholder)}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-muted px-3 font-mono text-[13px] font-semibold break-all transition-colors outline-none hover:bg-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-9"
          >
            {placeholder}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
