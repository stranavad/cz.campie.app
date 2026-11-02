import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useAccountQuery, useLogOutMutation } from '@/core/account';

// Shown only while an admin is signed in.
export function LogOutButton() {
  const { t } = useTranslation();
  const account = useAccountQuery();
  const logOut = useLogOutMutation();

  if (!account.isSuccess) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" className="ml-auto" disabled={logOut.isPending} onClick={() => logOut.mutate()}>
      {t('platformShell.logOut')}
    </Button>
  );
}
