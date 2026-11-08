import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
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
    <span className="mt-1 flex flex-col items-start gap-1">
      <Badge variant="danger">{t('emailUndeliverable')}</Badge>
      <span className="text-[13px] leading-snug text-muted-foreground">{t('detail.emailUndeliverable')}</span>
      {canClear ? (
        <Button
          type="button"
          variant="link"
          className="min-h-9 text-sm"
          disabled={clear.isPending}
          onClick={() => clear.mutate(email)}
        >
          {t('detail.clearUndeliverable')}
        </Button>
      ) : null}
      {clear.isError ? (
        <span role="alert" className="text-[13px] text-destructive">
          {t('detail.clearUndeliverableFailed')}
        </span>
      ) : null}
    </span>
  );
}
