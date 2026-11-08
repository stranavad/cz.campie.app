import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useClearUndeliverableMutation } from '@/features/participants/api/participants.queries';

interface UndeliverableBadgeProps {
  organisationId: string;
  registrationId: string;
  email: string;
  canClear: boolean;
}

// An address the mail provider reported undeliverable; Registrations write may clear the mark once the
// family says it works again.
export function UndeliverableBadge({ organisationId, registrationId, email, canClear }: UndeliverableBadgeProps) {
  const { t } = useTranslation('participants');
  const clear = useClearUndeliverableMutation(organisationId, registrationId);

  return (
    <span className="ml-2 inline-flex flex-wrap items-center gap-2">
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-950">
        {t('detail.emailUndeliverable')}
      </span>
      {canClear ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={clear.isPending}
          onClick={() => clear.mutate(email)}
        >
          {t('detail.clearUndeliverable')}
        </Button>
      ) : null}
      {clear.isError ? <span className="text-xs text-destructive">{t('detail.clearUndeliverableFailed')}</span> : null}
    </span>
  );
}
