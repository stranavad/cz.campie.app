import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { TabNav, tabNavItemClassName } from '@/components/ui/tab-nav';
import { LEGAL_PAGES } from '@/core/platform-shell/components/legal-pages.constant';

interface LegalTabsProps {
  className?: string;
}

// The legal texts as pills in the public header, the open one marked by the router.
export function LegalTabs({ className }: LegalTabsProps) {
  const { t } = useTranslation();

  return (
    <TabNav aria-label={t('platformShell.legal.label')} className={className}>
      {LEGAL_PAGES.map((page) => (
        <Link key={page.to} to={page.to} className={tabNavItemClassName}>
          {t(page.tabLabel)}
        </Link>
      ))}
    </TabNav>
  );
}
