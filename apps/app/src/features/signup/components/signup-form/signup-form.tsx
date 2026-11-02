import { useTranslation } from 'react-i18next';

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
        <p role="alert" className="text-sm text-destructive">
          {t(`failure.${failure}`)}
        </p>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('submit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
