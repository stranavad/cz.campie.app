import { useTranslation } from 'react-i18next';

interface LegalSectionProps {
  // The table of contents links here.
  id: string;
  // The article number, its paragraphs numbered under it; null for an unnumbered section.
  number: string | null;
  heading: string;
  paragraphs: readonly string[];
}

// One article or section of a legal text.
export function LegalSection({ id, number, heading, paragraphs }: LegalSectionProps) {
  const { t } = useTranslation('legal');
  const isNumbered = number !== null;

  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="text-2xl leading-tight font-bold tracking-[-0.02em] sm:text-[26px]">
        {isNumbered ? t('numberedHeading', { number, heading }) : heading}
      </h2>
      {paragraphs.map((paragraph, index) => (
        <p key={paragraph}>
          {isNumbered ? (
            <span className="mr-2 font-semibold text-subtle-foreground tabular-nums">
              {t('paragraphNumber', { article: number, paragraph: index + 1 })}
            </span>
          ) : null}
          {paragraph}
        </p>
      ))}
    </section>
  );
}
