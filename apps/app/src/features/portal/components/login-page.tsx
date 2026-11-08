import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGuardianSignInMutation } from '@/features/portal/api/portal.queries';
import { LoginForm } from '@/features/portal/components/login-form/login-form';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

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
    <PortalColumn className="max-w-md gap-5 pt-8 sm:pt-14">
      <header className="flex flex-col gap-2.5 px-1">
        <h1 className="text-title">{t('login.title')}</h1>
        <p className="text-muted-foreground">{token === '' ? t('login.intro') : t('login.confirm')}</p>
      </header>
      {token !== '' && !signIn.isError ? (
        <Card>
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={signIn.isPending}
            onClick={() =>
              signIn.mutate(
                { token },
                { onSuccess: () => void navigate({ to: '/organisation/portal', replace: true }) },
              )
            }
          >
            {t('login.signIn')}
          </Button>
        </Card>
      ) : (
        <>
          {signIn.isError ? <StatusMessage tone="danger">{t('login.linkInvalid')}</StatusMessage> : null}
          <LoginForm />
        </>
      )}
    </PortalColumn>
  );
}
