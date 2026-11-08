import { RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  useCancelAllMutation,
  useCancelParticipantMutation,
  useRegeneratePrihlaskaMutation,
  useRemoveGuardianMutation,
} from '@/features/participants/api/participants.queries';
import { AccessEmails } from '@/features/participants/components/access-emails';

// Cancelling children, access emails, removing a guardian and generating a Přihláška again.
export function RegistrationControls({
  organisationId,
  detail,
}: {
  organisationId: string;
  detail: RegistrationDetail;
}) {
  const { t } = useTranslation('participants');
  // An irreversible action waits for a second click on its confirmation.
  const [confirming, setConfirming] = useState<string | null>(null);
  const confirmed = (key: string, act: () => void) => () => {
    if (confirming === key) {
      setConfirming(null);
      act();
    } else {
      setConfirming(key);
    }
  };
  const cancel = useCancelParticipantMutation(organisationId, detail.id);
  const cancelAll = useCancelAllMutation(organisationId, detail.id);
  const removeGuardian = useRemoveGuardianMutation(organisationId, detail.id);
  const regenerate = useRegeneratePrihlaskaMutation(organisationId, detail.id);
  const registered = detail.participants.filter(({ status }) => status === 'registered');

  return (
    <Card>
      <CardTitle>{t('controls.title')}</CardTitle>
      <ul className="flex flex-col divide-y divide-border-subtle text-sm">
        {detail.participants.map((participant) => (
          <li key={participant.id} className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0">
            <span className="min-w-0 flex-1 font-semibold">
              {t('name', { first: participant.firstName, last: participant.lastName })}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => regenerate.mutate(participant.id)}>
              <RefreshCwIcon aria-hidden="true" />
              {t('controls.regenerate')}
            </Button>
            {participant.status === 'registered' ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={cancel.isPending}
                onClick={confirmed(`cancel-${participant.id}`, () => cancel.mutate(participant.id))}
              >
                {confirming === `cancel-${participant.id}` ? t('controls.confirm') : t('controls.cancel')}
              </Button>
            ) : (
              <Badge>{t('cancelled')}</Badge>
            )}
          </li>
        ))}
      </ul>
      {regenerate.isSuccess ? (
        <Alert variant="success">
          <output>{t('controls.regenerating')}</output>
        </Alert>
      ) : null}
      {registered.length > 1 ? (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="self-start"
          disabled={cancelAll.isPending}
          onClick={confirmed('cancel-all', () => cancelAll.mutate())}
        >
          {confirming === 'cancel-all' ? t('controls.confirm') : t('controls.cancelAll')}
        </Button>
      ) : null}
      <CardDescription>{t('controls.cancelNote')}</CardDescription>
      {detail.guardians.length > 1 ? (
        <ul className="flex flex-col gap-2 border-t border-border-subtle pt-4 text-sm">
          {detail.guardians.map((guardian) => (
            <li key={guardian.position} className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 break-all">{t('controls.guardian', { email: guardian.email })}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeGuardian.mutate(guardian.position)}
              >
                {t('controls.removeGuardian')}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <AccessEmails organisationId={organisationId} detail={detail} />
    </Card>
  );
}
