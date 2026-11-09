import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useGuardianSignOutMutation } from '@/features/portal/api/portal.queries';

// Signs the guardian out of the portal, for the shell's header, and returns to the login.
export function SignOutButton() {
  const { t } = useTranslation('portal');
  const navigate = useNavigate();
  const signOut = useGuardianSignOutMutation();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-11"
      disabled={signOut.isPending}
      onClick={() =>
        signOut.mutate(undefined, {
          onSettled: () => void navigate({ to: '/organisation/portal/prihlaseni', replace: true }),
        })
      }
    >
      {t('signOut')}
    </Button>
  );
}
