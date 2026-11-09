import { useTranslation } from 'react-i18next';

import { sectionAnchor } from '@/features/legal/components/legal-document/section-anchor.helper';
import { useActiveSection } from '@/features/legal/components/legal-document/use-active-section.hook';

interface LegalTocProps {
  headings: readonly string[];
  // Contract articles show their numbers.
  numbered: boolean;
}

// The sections of a legal text as in-page links, pinned beside it on a wide screen with the one being read
// marked; a phone reads straight on.
export function LegalToc({ headings, numbered }: LegalTocProps) {
  const { t } = useTranslation('legal');
  const active = useActiveSection(headings.length);

  return (
    <nav aria-label={t('toc')} className="hidden flex-col gap-0.5 text-[15px] leading-snug lg:sticky lg:top-6 lg:flex">
      <span className="px-3 pb-2 text-[13px] font-bold text-muted-foreground">{t('toc')}</span>
      {headings.map((heading, index) => (
        <a
          key={heading}
          href={`#${sectionAnchor(index)}`}
          aria-current={index === active ? 'location' : undefined}
          className="flex min-h-10 gap-2.5 rounded-xl px-3 py-2 font-medium text-nav-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=location]:bg-muted aria-[current=location]:font-bold aria-[current=location]:text-foreground"
        >
          {numbered ? <span className="min-w-[1.1rem] text-subtle-foreground tabular-nums">{index + 1}</span> : null}
          <span>{heading}</span>
        </a>
      ))}
    </nav>
  );
}
