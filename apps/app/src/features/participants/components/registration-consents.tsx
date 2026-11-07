import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import {
  useDownloadSignedConsentMutation,
  useRegistrationConsentsQuery,
} from '@/features/participants/api/participants.queries';

interface RegistrationConsentsProps {
  organisationId: string;
  registrationId: string;
}

// Each child's Consents on the Registration: state, items declined, and every signature with its PDF.
export function RegistrationConsents({ organisationId, registrationId }: RegistrationConsentsProps) {
  const { t } = useTranslation('participants');
  const consents = useRegistrationConsentsQuery(organisationId, registrationId);
  const download = useDownloadSignedConsentMutation(organisationId);
  // A link to open by hand when the browser blocked the new tab.
  const [blocked, setBlocked] = useState<string | null>(null);
  const participants = consents.data?.participants ?? [];

  if (consents.isError) {
    return <p className="text-sm text-destructive">{t('consents.loadFailed')}</p>;
  }

  if (participants.every((participant) => participant.consents.length === 0)) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('consents.title')}</h2>
      {participants.map((participant) => (
        <div key={participant.id} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            {t('name', { first: participant.firstName, last: participant.lastName })}
          </h3>
          <ul className="flex flex-col divide-y rounded-lg border text-sm">
            {participant.consents.map((consent) => (
              <li key={consent.consentId} className="flex flex-col gap-1 p-3">
                <div className="flex flex-wrap gap-3">
                  <span className="font-medium">{consent.title}</span>
                  <span className={consent.state === 'signed' ? '' : 'text-destructive'}>
                    {t(`consents.states.${consent.state}`)}
                  </span>
                </div>
                {consent.declinedItems.length === 0 ? null : (
                  <p>{t('consents.declined', { items: consent.declinedItems.join('; ') })}</p>
                )}
                {consent.signatures.map((signature) => (
                  <div key={signature.id} className="flex flex-wrap items-center gap-3 text-muted-foreground">
                    <span>
                      {t('consents.signature', {
                        version: signature.version,
                        name: signature.signerName,
                        date: czechDateTime(signature.signedAt),
                      })}
                    </span>
                    {signature.superseded ? <span>{t('consents.superseded')}</span> : null}
                    {signature.withdrawnAt === null ? null : (
                      <span>{t('consents.withdrawnAt', { date: czechDateTime(signature.withdrawnAt) })}</span>
                    )}
                    {signature.hasPdf ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={download.isPending}
                        onClick={() => {
                          // Opened at the click, where browsers allow it, and pointed at the link once it comes.
                          const tab = window.open('', '_blank');

                          download.mutate(signature.id, {
                            onSuccess: ({ url }) => (tab === null ? setBlocked(url) : tab.location.assign(url)),
                            onError: () => tab?.close(),
                          });
                        }}
                      >
                        {t('consents.pdf')}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {download.isError ? <p className="text-sm text-destructive">{t('consents.downloadFailed')}</p> : null}
      {blocked === null ? null : (
        <a href={blocked} target="_blank" rel="noreferrer" className="self-start text-sm underline">
          {t('consents.openPdf')}
        </a>
      )}
    </section>
  );
}
