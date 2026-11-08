import {
  Building2Icon,
  ClipboardListIcon,
  HistoryIcon,
  HouseIcon,
  ShieldCheckIcon,
  TentIcon,
  UsersIcon,
} from 'lucide-react';

import { membershipAllows, useAccountQuery, useCurrentMembership } from '@/core/account';

// The admin pages this admin may open, in the sidebar's order.
export function useAdminNav() {
  const account = useAccountQuery();
  const { membership } = useCurrentMembership();
  const isOwner = membership?.owner === true;
  const items = [
    { to: '/platform', label: 'home', icon: HouseIcon, exact: true, shown: membership !== undefined },
    {
      to: '/platform/prihlasky',
      label: 'registrations',
      icon: ClipboardListIcon,
      exact: false,
      shown: membershipAllows(membership, 'registrations', 'read'),
    },
    {
      to: '/platform/tabory',
      label: 'camps',
      icon: TentIcon,
      exact: false,
      shown: membershipAllows(membership, 'campSettings', 'read'),
    },
    { to: '/platform/uzivatele', label: 'team', icon: UsersIcon, exact: false, shown: isOwner },
    { to: '/platform/nastaveni', label: 'organisation', icon: Building2Icon, exact: false, shown: isOwner },
    { to: '/platform/historie', label: 'auditLog', icon: HistoryIcon, exact: false, shown: isOwner },
    {
      to: '/platform/konzole',
      label: 'console',
      icon: ShieldCheckIcon,
      exact: false,
      shown: account.data?.operator === true,
    },
  ] as const;

  return items.filter((item) => item.shown);
}
