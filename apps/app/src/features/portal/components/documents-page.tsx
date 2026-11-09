import { Navigate } from '@tanstack/react-router';
import { FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { DownloadList } from '@/features/portal/components/documents/download-list';
import { RequirementCard } from '@/features/portal/components/documents/requirement-card';
import { RequirementRow } from '@/features/portal/components/documents/requirement-row';
import { useDocumentsPage } from '@/features/portal/components/documents/use-documents-page.hook';
import { ParticipantSwitch } from '@/features/portal/components/shared/participant-switch';
import { PortalBackHeader } from '@/features/portal/components/shared/portal-back-header';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { HttpError } from '@/lib/api';

interface DocumentsPageProps {
  registrationId: string;
}

// A Registration's documents: what each child still hands in, in full; the rest as rows; and what the camp
// publishes to download.
export function DocumentsPage({ registrationId }: DocumentsPageProps) {
  const { t } = useTranslation('portal');
  const page = useDocumentsPage(registrationId);
  const { documents, selected } = page;

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

  const { downloads, requirements } = documents.data;

  return (
    <PortalColumn className="gap-3">
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
        <ParticipantSwitch participants={page.switchParticipants} selectedId={selected?.id} onSelect={page.select} />
      )}
      {page.toHandIn.map((requirement) => (
        <RequirementCard
          key={`${selected?.id ?? ''}-${requirement.id}`}
          registrationId={registrationId}
          requirement={requirement}
          participant={selected}
        />
      ))}
      {selected === undefined || page.handedIn.length === 0 ? null : (
        <section className="flex flex-col gap-2.5 pt-3">
          <h2 className="px-1 text-[13px] font-bold text-muted-foreground">{t('documents.others')}</h2>
          <ul className="flex flex-col gap-2.5">
            {page.handedIn.map((requirement) => (
              <RequirementRow
                key={`${selected.id}-${requirement.id}`}
                registrationId={registrationId}
                requirement={requirement}
                participant={selected}
              />
            ))}
          </ul>
        </section>
      )}
      <DownloadList downloads={downloads} />
    </PortalColumn>
  );
}
