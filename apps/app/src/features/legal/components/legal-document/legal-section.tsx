import { useTranslation } from 'react-i18next';

import { LegalText } from '@/features/legal/components/legal-document/legal-text';

interface LegalSectionProps {
  // The article number, its paragraphs numbered under it; null for an unnumbered section.
  number: string | null;
  heading: string;
  paragraphs: readonly string[];
}

// One article or section of a legal text.
export function LegalSection({ number, heading, paragraphs }: LegalSectionProps) {
  const { t } = useTranslation('legal');

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{number === null ? heading : t('numberedHeading', { number, heading })}</h2>
      {paragraphs.map((paragraph, index) => (
        <p key={paragraph}>
          {number === null ? null : (
            <span className="mr-2 font-medium tabular-nums">
              {t('paragraphNumber', { article: number, paragraph: index + 1 })}
            </span>
          )}
          <LegalText text={paragraph} />
        </p>
      ))}
    </section>
  );
}
