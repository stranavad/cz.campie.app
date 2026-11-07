import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useAccountQuery, useLogOutMutation } from '@/core/account';

// The account link and logging out, shown only while an admin is signed in.
export function LogOutButton() {
  const { t } = useTranslation();
  const account = useAccountQuery();
  const logOut = useLogOutMutation();

  if (!account.isSuccess) {
    return null;
  }

  return (
    <div className="ml-auto flex items-baseline gap-1">
      <Link to="/platform/ucet" className="text-sm underline-offset-4 hover:underline">
        {t('platformShell.account')}
      </Link>
      <Button variant="ghost" size="sm" disabled={logOut.isPending} onClick={() => logOut.mutate()}>
        {t('platformShell.logOut')}
      </Button>
    </div>
  );
}
