import { useTranslation } from 'react-i18next';

interface EmailPlaceholdersProps {
  // As written into the subject or text: {{name}}.
  placeholders: readonly string[];
}

// The data an email type can fill in, as chips.
export function EmailPlaceholders({ placeholders }: EmailPlaceholdersProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{t('emails.placeholders')}</span>
      <ul className="flex flex-wrap gap-1.5">
        {placeholders.map((placeholder) => (
          <li
            key={placeholder}
            className="inline-flex h-8 items-center rounded-full bg-muted px-3 font-mono text-[13px] font-semibold break-all"
          >
            {placeholder}
          </li>
        ))}
      </ul>
    </div>
  );
}
