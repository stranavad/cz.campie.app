import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LegalSection } from '@/features/legal/components/legal-document/legal-section';
import { LegalToc } from '@/features/legal/components/legal-document/legal-toc';
import { LEGAL_VERSION_OF } from '@/features/legal/components/legal-document/legal-version.constant';
import { sectionAnchor } from '@/features/legal/components/legal-document/section-anchor.helper';

interface LegalDocumentViewProps {
  document: 'terms' | 'dataProcessingAgreement' | 'dataPage' | 'privacy';
  // Contract articles are numbered (1., 1.1); an explanatory page is not.
  numbered?: boolean;
  // Shown between the introduction and the sections.
  children?: ReactNode;
}

// A long legal or explanatory text from the legal namespace: title, version, introduction, sections of
// paragraphs, with a table of contents beside it on a wide screen. The public header switches between texts.
export function LegalDocumentView({ document, numbered = false, children }: LegalDocumentViewProps) {
  const { t } = useTranslation('legal');
  const intro = t(`${document}.intro`, { returnObjects: true });
  const sections = t(`${document}.sections`, { returnObjects: true });
  const headings = sections.map((section) => section.heading);
  const version = LEGAL_VERSION_OF[document];

  return (
    <div className="grid items-start gap-12 py-2 sm:py-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <LegalToc headings={headings} numbered={numbered} />
      <article className="flex max-w-3xl min-w-0 flex-col gap-7 text-base leading-[1.7] sm:text-[17px]">
        <header className="flex flex-col gap-4">
          <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-5xl">
            {t(`${document}.title`)}
          </h1>
          {version === null ? null : <p className="text-sm text-muted-foreground">{t('version', { version })}</p>}
          {intro.map((paragraph) => (
            <p key={paragraph} className="text-nav-foreground">
              {paragraph}
            </p>
          ))}
        </header>
        {children}
        {sections.map((section, index) => (
          <LegalSection
            key={section.heading}
            id={sectionAnchor(index)}
            number={numbered ? String(index + 1) : null}
            heading={section.heading}
            paragraphs={section.paragraphs}
          />
        ))}
      </article>
    </div>
  );
}
