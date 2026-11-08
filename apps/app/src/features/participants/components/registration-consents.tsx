import { CircleAlertIcon, ExternalLinkIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Card, CardTitle } from '@/components/ui/card';
import {
  useDownloadSignedConsentMutation,
  useRegistrationConsentsQuery,
} from '@/features/participants/api/participants.queries';
import { ConsentItem } from '@/features/participants/components/consent-item';

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
  const openPdf = (signatureId: string) => {
    // Opened at the click, where browsers allow it, and pointed at the link once it comes. A noopener tab
    // would come back as null, so the tab is cut from this page by hand.
    const tab = window.open('', '_blank');

    if (tab !== null) {
      tab.opener = null;
    }

    download.mutate(signatureId, {
      onSuccess: ({ url }) => (tab === null ? setBlocked(url) : tab.location.assign(url)),
      onError: () => tab?.close(),
    });
  };

  if (consents.isError) {
    return (
      <Alert variant="danger" role="alert">
        <CircleAlertIcon aria-hidden="true" />
        {t('consents.loadFailed')}
      </Alert>
    );
  }

  if (participants.every((participant) => participant.consents.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('consents.title')}</CardTitle>
      {participants.map((participant) => (
        <div key={participant.id} className="flex flex-col gap-2">
          {participants.length > 1 ? (
            <h3 className="text-[13px] font-medium text-muted-foreground">
              {t('name', { first: participant.firstName, last: participant.lastName })}
            </h3>
          ) : null}
          <ul className="flex flex-col divide-y divide-border-subtle text-sm">
            {participant.consents.map((consent) => (
              <ConsentItem
                key={consent.consentId}
                consent={consent}
                onOpenPdf={openPdf}
                isOpening={download.isPending}
              />
            ))}
          </ul>
        </div>
      ))}
      {download.isError ? <p className="text-sm text-destructive">{t('consents.downloadFailed')}</p> : null}
      {blocked === null ? null : (
        <a
          href={blocked}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold underline"
        >
          <ExternalLinkIcon aria-hidden="true" className="size-4" />
          {t('consents.openPdf')}
        </a>
      )}
    </Card>
  );
}
