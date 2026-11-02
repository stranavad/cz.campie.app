import { Trans, useTranslation } from 'react-i18next';

import { TextLink } from '@/components/text-link';
import { SignupForm } from '@/features/signup/components/signup-form/signup-form';
import { SIGNUP_LINKS } from '@/features/signup/signup.constant';

export function SignupPage() {
  const { t } = useTranslation('signup');

  return (
    <section className="flex max-w-xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('intro')}</p>
        <p className="text-sm text-muted-foreground">
          <Trans t={t} i18nKey="dataPage" components={{ a: <TextLink href={SIGNUP_LINKS.dataPage} /> }} />
        </p>
      </header>
      <SignupForm />
    </section>
  );
}
