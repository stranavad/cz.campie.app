import { Link, useNavigate } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAccountQuery, useLogOutMutation } from '@/core/account';

// The signed-in admin at the bottom of the sidebar: their account page, the theme and logging out.
export function SidebarAccount() {
  const { t } = useTranslation();
  const account = useAccountQuery();
  const logOut = useLogOutMutation();
  const navigate = useNavigate();

  if (account.data === undefined) {
    return null;
  }

  return (
    <div className="mt-auto flex items-center gap-1 border-t border-border-subtle pt-4">
      <Link
        to="/platform/ucet"
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl p-2 transition-colors hover:bg-muted data-[status=active]:bg-brand-soft"
      >
        <Avatar name={account.data.email} className="size-8.5" />
        <span className="flex min-w-0 flex-col text-sm leading-tight">
          <span className="truncate font-semibold">{account.data.email}</span>
          <span className="text-xs text-muted-foreground">{t('platformShell.account')}</span>
        </span>
      </Link>
      <ThemeToggle />
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        aria-label={t('platformShell.logOut')}
        title={t('platformShell.logOut')}
        disabled={logOut.isPending}
        onClick={() =>
          logOut.mutate(undefined, {
            onSuccess: () => void navigate({ to: '/platform/prihlaseni', replace: true }),
          })
        }
      >
        <LogOutIcon className="size-5" />
      </Button>
    </div>
  );
}
