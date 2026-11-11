import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { useCurrentMembership, useLeaveSupportMutation } from '@/core/account';

// Reminds the Platform operator they act inside an Organisation under its support grant, and lets them
// leave it for the console.
export function SupportBanner() {
  const { t } = useTranslation();
  const { membership } = useCurrentMembership();
  const leave = useLeaveSupportMutation();
  const navigate = useNavigate();

  if (membership?.support === undefined || membership.support === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-warning px-4 py-2.5 text-center text-sm font-medium text-warning-foreground">
      <output>
        {t(membership.support.allowWrites ? 'platformShell.supportWrites' : 'platformShell.supportReadOnly', {
          organisation: membership.organisation.displayName,
          until: czechDateTime(membership.support.expiresAt),
        })}
      </output>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={leave.isPending}
        onClick={() =>
          leave.mutate(membership.organisation.id, { onSuccess: () => void navigate({ to: '/platform/konzole' }) })
        }
      >
        {t('platformShell.supportLeave')}
      </Button>
      {leave.isError ? <p role="alert">{t('platformShell.supportLeaveFailed')}</p> : null}
    </div>
  );
}
