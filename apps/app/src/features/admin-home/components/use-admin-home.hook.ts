import { Building2Icon, ClipboardListIcon, HistoryIcon, ShieldCheckIcon, TentIcon, UsersIcon } from 'lucide-react';

import { membershipAllows, useAccountQuery, useCurrentMembership } from '@/core/account';

export function useAdminHome() {
  const { membership, ...state } = useCurrentMembership();
  const account = useAccountQuery();
  const isOwner = membership?.owner === true;
  const isOperator = account.data?.operator === true;

  // The areas this admin may open, each a card on the overview, in the sidebar's order.
  const links = [
    {
      to: '/platform/prihlasky',
      name: 'registrations',
      icon: ClipboardListIcon,
      shown: membershipAllows(membership, 'registrations', 'read'),
    },
    {
      to: '/platform/tabory',
      name: 'camps',
      icon: TentIcon,
      shown: membershipAllows(membership, 'campSettings', 'read'),
    },
    { to: '/platform/uzivatele', name: 'team', icon: UsersIcon, shown: isOwner },
    { to: '/platform/nastaveni', name: 'organisation', icon: Building2Icon, shown: isOwner },
    { to: '/platform/historie', name: 'auditLog', icon: HistoryIcon, shown: isOwner },
    { to: '/platform/konzole', name: 'console', icon: ShieldCheckIcon, shown: isOperator },
  ] as const;

  return {
    ...state,
    organisation: membership?.organisation,
    canCreateRegistration: membershipAllows(membership, 'registrations', 'write'),
    links: links.filter((link) => link.shown),
    isOperator,
  };
}
