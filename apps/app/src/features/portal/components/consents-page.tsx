import { Navigate } from '@tanstack/react-router';
import { FileSignatureIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { useGuardianConsentsQuery } from '@/features/portal/api/portal.queries';
import { ConsentRow } from '@/features/portal/components/consents/consent-row';
import { ParticipantSwitch } from '@/features/portal/components/shared/participant-switch';
import { PortalBackHeader } from '@/features/portal/components/shared/portal-back-header';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { useSelectedParticipant } from '@/features/portal/components/shared/use-selected-participant.hook';
import { HttpError } from '@/lib/api';

// The Consents of a Registration's children: what is signed, and each one to read and sign.
export function ConsentsPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const consents = useGuardianConsentsQuery(registrationId);
  const participants = consents.data?.participants ?? [];
  const { selected, select } = useSelectedParticipant(participants);
  const [open, setOpen] = useState<{ participantId: string; consentId: string } | null>(null);

  if (consents.error instanceof HttpError && consents.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (consents.isPending) {
    return null;
  }

  return (
    <PortalColumn>
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
      <ParticipantSwitch
        participants={participants.map((participant) => ({
          id: participant.id,
          firstName: participant.firstName,
          count: participant.consents.filter((consent) => consent.state === 'unsigned').length,
        }))}
        selectedId={selected?.id}
        onSelect={select}
      />
      {consents.isSuccess && (selected === undefined || selected.consents.length === 0) ? (
        <EmptyState icon={<FileSignatureIcon />} title={t('consents.none')} />
      ) : null}
      {selected?.consents.map((consent) => (
        <ConsentRow
          key={`${selected.id}-${consent.consentId}`}
          registrationId={registrationId}
          participantId={selected.id}
          consent={consent}
          isOpen={open?.participantId === selected.id && open.consentId === consent.consentId}
          onOpen={() => setOpen({ participantId: selected.id, consentId: consent.consentId })}
        />
      ))}
    </PortalColumn>
  );
}
