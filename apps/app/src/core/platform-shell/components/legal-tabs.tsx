import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { TabNav, tabNavItemClassName } from '@/components/ui/tab-nav';

interface LegalTabsProps {
  className?: string;
}

// The three legal texts as pills in the public header, the open one marked by the router.
export function LegalTabs({ className }: LegalTabsProps) {
  const { t } = useTranslation();

  return (
    <TabNav aria-label={t('platformShell.legal.label')} className={className}>
      <Link to="/platform/podminky" className={tabNavItemClassName}>
        {t('platformShell.legal.terms')}
      </Link>
      <Link to="/platform/zpracovatelska-smlouva" className={tabNavItemClassName}>
        {t('platformShell.legal.dataProcessingAgreement')}
      </Link>
      <Link to="/platform/zpracovani-dat" className={tabNavItemClassName}>
        {t('platformShell.legal.dataPageShort')}
      </Link>
    </TabNav>
  );
}
