import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { useCurrentMembership } from '@/core/account';

// Reminds the Platform operator they act inside an Organisation under its support grant.
export function SupportBanner() {
  const { t } = useTranslation();
  const { membership } = useCurrentMembership();

  if (membership?.support === undefined || membership.support === null) {
    return null;
  }

  return (
    <output className="block bg-warning px-4 py-2.5 text-center text-sm font-medium text-warning-foreground">
      {t(membership.support.allowWrites ? 'platformShell.supportWrites' : 'platformShell.supportReadOnly', {
        organisation: membership.organisation.displayName,
        until: czechDateTime(membership.support.expiresAt),
      })}
    </output>
  );
}
