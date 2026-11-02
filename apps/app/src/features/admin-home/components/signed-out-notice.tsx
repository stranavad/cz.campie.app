import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';

export function SignedOutNotice() {
  const { t } = useTranslation('adminHome');

  return (
    <section className="flex max-w-xl flex-col items-start gap-3 py-12">
      <h1 className="text-2xl font-semibold">{t('signedOut.title')}</h1>
      <p className="text-muted-foreground">{t('signedOut.description')}</p>
      <Link to="/platform/registrace-organizace" className={buttonVariants()}>
        {t('signedOut.signup')}
      </Link>
    </section>
  );
}
