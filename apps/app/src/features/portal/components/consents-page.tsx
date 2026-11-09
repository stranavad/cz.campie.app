import { Navigate } from '@tanstack/react-router';
import { FileSignatureIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { ConsentRow } from '@/features/portal/components/consents/consent-row';
import { useConsentsPage } from '@/features/portal/components/consents/use-consents-page.hook';
import { ParticipantSwitch } from '@/features/portal/components/shared/participant-switch';
import { PortalBackHeader } from '@/features/portal/components/shared/portal-back-header';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { HttpError } from '@/lib/api';

// The Consents of a Registration's children: the one to sign next open, the rest as rows.
export function ConsentsPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const page = useConsentsPage(registrationId);
  const { consents, selected } = page;

  if (consents.error instanceof HttpError && consents.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (consents.isPending) {
    return null;
  }

  return (
    <PortalColumn className="gap-3">
      <PortalBackHeader
        title={t('consents.title')}
        subtitle={
          selected === undefined ? undefined : t('participant', { first: selected.firstName, last: selected.lastName })
        }
      />
      {consents.isError ? (
        <Alert variant="danger" role="alert">
          {t('error')}
        </Alert>
      ) : null}
      <ParticipantSwitch participants={page.switchParticipants} selectedId={selected?.id} onSelect={page.select} />
      {consents.isSuccess && (selected === undefined || selected.consents.length === 0) ? (
        <EmptyState icon={<FileSignatureIcon />} title={t('consents.none')} />
      ) : null}
      {selected?.consents.map((consent) => (
        <ConsentRow
          key={`${selected.id}-${consent.consentId}`}
          registrationId={registrationId}
          participantId={selected.id}
          consent={consent}
          isOpen={page.isOpen(consent.consentId)}
          onOpen={() => page.open(selected.id, consent.consentId)}
        />
      ))}
    </PortalColumn>
  );
}
