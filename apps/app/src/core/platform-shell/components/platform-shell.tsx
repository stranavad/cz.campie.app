import { useAccountQuery, useCurrentMembership } from '@/core/account';
import { AdminLayout } from '@/core/platform-shell/components/admin-layout';
import { PublicLayout } from '@/core/platform-shell/components/public-layout';

// Signup, the admin interface and the operator console on the main host: a signed-in admin works in the
// admin layout with its navigation; everyone else (login, signup, password reset, legal pages) sees the
// platform's public layout. A failed background refetch keeps the account's data, so it keeps the admin
// layout too instead of unmounting the page being worked on; only a 401 means signed out.
export function PlatformShell() {
  const account = useAccountQuery();
  const { isSignedOut } = useCurrentMembership();

  return account.data !== undefined && !isSignedOut ? <AdminLayout /> : <PublicLayout />;
}
