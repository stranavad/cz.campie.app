import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

// The terms, the data processing agreement and the data page, on every page of the main host.
export function LegalFooter() {
  const { t } = useTranslation();
  const linkClassName = 'rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline';

  return (
    <footer className="border-t border-border">
      <nav
        aria-label={t('platformShell.legal.label')}
        className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-6 gap-y-2 px-4 py-5 text-sm text-muted-foreground sm:px-6 lg:px-10"
      >
        <Link to="/platform/podminky" className={linkClassName}>
          {t('platformShell.legal.terms')}
        </Link>
        <Link to="/platform/zpracovatelska-smlouva" className={linkClassName}>
          {t('platformShell.legal.dataProcessingAgreement')}
        </Link>
        <Link to="/platform/zpracovani-dat" className={linkClassName}>
          {t('platformShell.legal.dataPage')}
        </Link>
      </nav>
    </footer>
  );
}
