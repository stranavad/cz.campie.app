import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useGuardianSignInMutation } from '@/features/portal/api/portal.queries';
import { LoginForm } from '@/features/portal/components/login-form/login-form';

interface LoginPageProps {
  // From the emailed link; empty when the guardian came to ask for one.
  token: string;
}

// Asks for a login link, or signs in with the one the guardian followed. Signing in waits for a click, so
// a mail scanner opening the link does not use it up, and a link someone else sent does not sign this
// browser into their portal unasked.
export function LoginPage({ token }: LoginPageProps) {
  const { t } = useTranslation('portal');
  const navigate = useNavigate();
  const signIn = useGuardianSignInMutation();

  return (
    <section className="flex max-w-sm flex-col gap-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('login.title')}</h1>
        <p className="text-muted-foreground">{token === '' ? t('login.intro') : t('login.confirm')}</p>
      </header>
      {token !== '' && !signIn.isError ? (
        <Button
          type="button"
          className="self-start"
          disabled={signIn.isPending}
          onClick={() =>
            signIn.mutate({ token }, { onSuccess: () => void navigate({ to: '/organisation/portal', replace: true }) })
          }
        >
          {t('login.signIn')}
        </Button>
      ) : (
        <>
          {signIn.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t('login.linkInvalid')}
            </p>
          ) : null}
          <LoginForm />
        </>
      )}
    </section>
  );
}
