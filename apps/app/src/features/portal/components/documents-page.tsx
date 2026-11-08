import { Navigate } from '@tanstack/react-router';
import { FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { useGuardianDocumentsQuery } from '@/features/portal/api/portal.queries';
import { DownloadList } from '@/features/portal/components/documents/download-list';
import { RequirementCard } from '@/features/portal/components/documents/requirement-card';
import { ParticipantSwitch } from '@/features/portal/components/shared/participant-switch';
import { PortalBackHeader } from '@/features/portal/components/shared/portal-back-header';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { useSelectedParticipant } from '@/features/portal/components/shared/use-selected-participant.hook';
import { HttpError } from '@/lib/api';

// A Registration's documents: what each child hands in, and what the camp publishes to download.
export function DocumentsPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const documents = useGuardianDocumentsQuery(registrationId);
  const { selected, select } = useSelectedParticipant(documents.data?.participants ?? []);

  if (documents.error instanceof HttpError && documents.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (documents.isPending) {
    return null;
  }

  if (documents.isError) {
    return (
      <PortalColumn>
        <PortalBackHeader title={t('documents.title')} />
        <Alert variant="danger" role="alert">
          {t('error')}
        </Alert>
      </PortalColumn>
    );
  }

  const { downloads, requirements, participants } = documents.data;

  return (
    <PortalColumn>
      <PortalBackHeader
        title={t('documents.title')}
        subtitle={
          selected === undefined || requirements.length === 0
            ? undefined
            : t('participant', { first: selected.firstName, last: selected.lastName })
        }
      />
      {downloads.length === 0 && requirements.length === 0 ? (
        <EmptyState icon={<FileTextIcon />} title={t('documents.none')} />
      ) : null}
      {requirements.length === 0 ? null : (
        <ParticipantSwitch
          participants={participants.map((participant) => ({
            id: participant.id,
            firstName: participant.firstName,
            count: requirements.filter(({ id }) => {
              const status = participant.uploads[id]?.[0]?.status;

              return status === undefined || status === 'returned';
            }).length,
          }))}
          selectedId={selected?.id}
          onSelect={select}
        />
      )}
      {requirements.map((requirement) => (
        <RequirementCard
          key={`${selected?.id ?? ''}-${requirement.id}`}
          registrationId={registrationId}
          requirement={requirement}
          participant={selected}
        />
      ))}
      <DownloadList downloads={downloads} />
    </PortalColumn>
  );
}
