import { useTranslation } from 'react-i18next';

import type { Account } from '@repo/schema/admins';

import { SettingsSection } from '@/components/settings-section';
import { Avatar } from '@/components/ui/avatar';
import { useAccountMemberships } from '@/features/account-settings/components/use-account-memberships.hook';

interface AccountMembershipsProps {
  memberships: Account['memberships'];
}

// The Organisations the admin works in: Owner, support, or the areas they may read or change.
export function AccountMemberships({ memberships }: AccountMembershipsProps) {
  const { t } = useTranslation();
  const rows = useAccountMemberships(memberships);

  if (rows.length === 0) {
    return null;
  }

  return (
    <SettingsSection title={t('accountSettings.organisations')} description={t('accountSettings.organisationsIntro')}>
      <ul className="flex flex-col">
        {rows.map(({ id, name, role }) => (
          <li
            key={id}
            className="flex items-center gap-3 border-t border-border-subtle py-3 first:border-t-0 first:pt-0"
          >
            <Avatar name={name} className="size-10" />
            <span className="flex min-w-0 flex-col leading-snug">
              <span className="font-semibold break-words">{name}</span>
              <span className="text-[13px] text-muted-foreground">{role}</span>
            </span>
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}
