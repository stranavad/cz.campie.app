import { Link } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { AccountSection } from '@/features/signup/components/signup-form/account-section';
import { CampSection } from '@/features/signup/components/signup-form/camp-section';
import { ConsentSection } from '@/features/signup/components/signup-form/consent-section';
import { ContactSection } from '@/features/signup/components/signup-form/contact-section';
import { OrganisationSection } from '@/features/signup/components/signup-form/organisation-section';
import { useSignupForm } from '@/features/signup/components/signup-form/use-signup-form.hook';

export function SignupForm() {
  const { t } = useTranslation('signup');
  const { form, failure } = useSignupForm();

  return (
    <Card className="gap-6 rounded-[32px] sm:gap-8 sm:p-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-card-title">{t('title')}</h2>
        <p className="text-muted-foreground">{t('intro')}</p>
      </header>
      <form
        noValidate
        className="flex flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <OrganisationSection form={form} />
        <ContactSection form={form} />
        <CampSection form={form} />
        <AccountSection form={form} />
        <ConsentSection form={form} />
        {failure === null ? null : (
          <Alert variant="danger" role="alert">
            {t(`failure.${failure}`)}
          </Alert>
        )}
        <form.AppForm>
          <form.SubmitButton size="lg" className="w-full">
            {t('submit')}
          </form.SubmitButton>
        </form.AppForm>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Trans
          t={t}
          i18nKey="logIn"
          components={{
            a: (
              <Link to="/platform/prihlaseni" className="font-semibold text-foreground underline underline-offset-4" />
            ),
          }}
        />
      </p>
    </Card>
  );
}
