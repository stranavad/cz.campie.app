import { useTranslation } from 'react-i18next';

import type { Account } from '@repo/schema/admins';

import { SettingsSection } from '@/components/settings-section';
import { Avatar } from '@/components/ui/avatar';

interface AccountMembershipsProps {
  memberships: Account['memberships'];
}

// The Organisations the admin works in, with their role in each.
export function AccountMemberships({ memberships }: AccountMembershipsProps) {
  const { t } = useTranslation();

  if (memberships.length === 0) {
    return null;
  }

  return (
    <SettingsSection title={t('accountSettings.organisations')} description={t('accountSettings.organisationsIntro')}>
      <ul className="flex flex-col">
        {memberships.map(({ organisation, owner, support }) => (
          <li
            key={organisation.id}
            className="flex items-center gap-3 border-t border-border-subtle py-3 first:border-t-0 first:pt-0"
          >
            <Avatar name={organisation.displayName} />
            <span className="flex min-w-0 flex-col leading-snug">
              <span className="font-semibold break-words">{organisation.displayName}</span>
              <span className="text-[13px] text-muted-foreground">
                {support === null
                  ? t(owner ? 'platformShell.role.owner' : 'platformShell.role.member')
                  : t('platformShell.role.support')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}
