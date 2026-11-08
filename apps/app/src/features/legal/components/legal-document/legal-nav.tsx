import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { TabNav, tabNavItemClassName } from '@/components/ui/tab-nav';

// The three legal texts side by side, so a reader moves between them without the footer.
export function LegalNav() {
  const { t } = useTranslation('legal');

  return (
    <TabNav aria-label={t('nav.label')}>
      <Link to="/platform/podminky" className={tabNavItemClassName}>
        {t('nav.terms')}
      </Link>
      <Link to="/platform/zpracovatelska-smlouva" className={tabNavItemClassName}>
        {t('nav.dataProcessingAgreement')}
      </Link>
      <Link to="/platform/zpracovani-dat" className={tabNavItemClassName}>
        {t('nav.dataPage')}
      </Link>
    </TabNav>
  );
}
