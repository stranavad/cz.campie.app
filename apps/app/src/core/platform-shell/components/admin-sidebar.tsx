import { AdminNav } from '@/core/platform-shell/components/admin-nav';
import { OrganisationBadge } from '@/core/platform-shell/components/organisation-badge';
import { SidebarAccount } from '@/core/platform-shell/components/sidebar-account';

// The admin's Organisation, the navigation it allows them, and their account.
export function AdminSidebar() {
  return (
    <div className="flex min-h-full flex-col gap-5 px-4 py-5">
      <div className="pr-12 lg:pr-0">
        <OrganisationBadge />
      </div>
      <AdminNav />
      <SidebarAccount />
    </div>
  );
}
