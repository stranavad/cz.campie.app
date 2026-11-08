import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { DraftNotice } from '@/features/legal/components/legal-document/draft-notice';
import { LegalSection } from '@/features/legal/components/legal-document/legal-section';
import { LegalText } from '@/features/legal/components/legal-document/legal-text';

interface LegalDocumentViewProps {
  document: 'terms' | 'dataProcessingAgreement' | 'dataPage';
  // Contract articles are numbered (1., 1.1); an explanatory page is not.
  numbered?: boolean;
  // Shown between the introduction and the sections.
  children?: ReactNode;
}

// A long legal or explanatory text from the legal namespace: title, introduction, sections of paragraphs.
export function LegalDocumentView({ document, numbered = false, children }: LegalDocumentViewProps) {
  const { t } = useTranslation('legal');
  const intro = t(`${document}.intro`, { returnObjects: true });
  const sections = t(`${document}.sections`, { returnObjects: true });

  return (
    <article className="flex max-w-3xl flex-col gap-6 py-8">
      <DraftNotice />
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">{t(`${document}.title`)}</h1>
        {intro.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground">
            <LegalText text={paragraph} />
          </p>
        ))}
      </header>
      {children}
      {sections.map((section, index) => (
        <LegalSection
          key={section.heading}
          number={numbered ? String(index + 1) : null}
          heading={section.heading}
          paragraphs={section.paragraphs}
        />
      ))}
    </article>
  );
}
