import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAddAccessEmailMutation,
  useCancelAllMutation,
  useCancelParticipantMutation,
  useRegeneratePrihlaskaMutation,
  useRemoveAccessEmailMutation,
  useRemoveGuardianMutation,
} from '@/features/participants/api/participants.queries';

// Cancelling children, access emails, removing a guardian and generating a Přihláška again.
export function RegistrationControls({
  organisationId,
  detail,
}: {
  organisationId: string;
  detail: RegistrationDetail;
}) {
  const { t } = useTranslation('participants');
  const [email, setEmail] = useState('');
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
  const addAccess = useAddAccessEmailMutation(organisationId, detail.id);
  const removeAccess = useRemoveAccessEmailMutation(organisationId, detail.id);
  const removeGuardian = useRemoveGuardianMutation(organisationId, detail.id);
  const regenerate = useRegeneratePrihlaskaMutation(organisationId, detail.id);
  const registered = detail.participants.filter(({ status }) => status === 'registered');

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('controls.title')}</h2>
      {detail.participants.map((participant) => (
        <div key={participant.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex-1">{t('name', { first: participant.firstName, last: participant.lastName })}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => regenerate.mutate(participant.id)}>
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
            <span className="text-muted-foreground">{t('cancelled')}</span>
          )}
        </div>
      ))}
      {regenerate.isSuccess ? <output className="text-sm">{t('controls.regenerating')}</output> : null}
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
      <p className="text-sm text-muted-foreground">{t('controls.cancelNote')}</p>
      {detail.guardians.length > 1
        ? detail.guardians.map((guardian) => (
            <div key={guardian.position} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{t('controls.guardian', { email: guardian.email })}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeGuardian.mutate(guardian.position)}
              >
                {t('controls.removeGuardian')}
              </Button>
            </div>
          ))
        : null}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t('controls.accessEmails')}</p>
        {detail.accessEmails.map((access) => (
          <div key={access.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1">
              {access.email}
              {access.undeliverable ? (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-950">
                  {t('detail.emailUndeliverable')}
                </span>
              ) : null}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => removeAccess.mutate(access.id)}>
              {t('controls.remove')}
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            type="email"
            aria-label={t('controls.newAccessEmail')}
            placeholder={t('controls.newAccessEmail')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={email.trim() === '' || addAccess.isPending}
            onClick={() => addAccess.mutate(email, { onSuccess: () => setEmail('') })}
          >
            {t('controls.add')}
          </Button>
        </div>
        {addAccess.isError ? <p className="text-sm text-destructive">{t('controls.addFailed')}</p> : null}
      </div>
    </section>
  );
}
