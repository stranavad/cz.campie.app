import { Link, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { useGuardianConsentsQuery } from '@/features/portal/api/portal.queries';
import { ConsentSignForm } from '@/features/portal/components/consent-sign-form';
import { HttpError } from '@/lib/api';

// The Consents of a Registration's children: what is signed, and each one to read and sign.
export function ConsentsPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const consents = useGuardianConsentsQuery(registrationId);
  const [open, setOpen] = useState<{ participantId: string; consentId: string } | null>(null);

  if (consents.error instanceof HttpError && consents.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (consents.isPending) {
    return null;
  }

  if (consents.isError) {
    return <p className="py-12">{t('error')}</p>;
  }

  return (
    <section className="flex flex-col gap-6 py-8">
      <Link to="/organisation/portal" className="text-sm underline">
        {t('edit.back')}
      </Link>
      <h1 className="text-2xl font-semibold">{t('consents.title')}</h1>
      {consents.data.participants.length === 0 ? <p>{t('consents.none')}</p> : null}
      {consents.data.participants.map((participant) => (
        <article key={participant.id} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            {t('participant', { first: participant.firstName, last: participant.lastName })}
          </h2>
          <ul className="flex flex-col divide-y rounded-lg border">
            {participant.consents.map((consent) => (
              <li key={consent.consentId} className="flex flex-col gap-2 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{consent.title}</span>
                  <span className={consent.state === 'signed' ? '' : 'text-destructive'}>
                    {consent.state === 'signed' && consent.signedAt !== null
                      ? t('consents.signedOn', { date: czechDateTime(consent.signedAt) })
                      : t('consents.unsigned')}
                  </span>
                  {consent.signedPdf === null ? null : (
                    <a href={consent.signedPdf.url} target="_blank" rel="noreferrer" className="underline">
                      {t('consents.signedPdf')}
                    </a>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setOpen({ participantId: participant.id, consentId: consent.consentId })}
                  >
                    {consent.state === 'signed' ? t('consents.open') : t('consents.readAndSign')}
                  </Button>
                </div>
                {open?.participantId === participant.id && open.consentId === consent.consentId ? (
                  <ConsentSignForm
                    params={{ registrationId, participantId: participant.id, consentId: consent.consentId }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
