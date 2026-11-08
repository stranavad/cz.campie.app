import { CircleAlertIcon, ExternalLinkIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Card, CardTitle } from '@/components/ui/card';
import { useDocumentReview, useRegistrationDocumentsQuery } from '@/features/participants/api/participants.queries';
import { DocumentRequirement } from '@/features/participants/components/documents/document-requirement';
import { InternalDocuments } from '@/features/participants/components/documents/internal-documents';

interface RegistrationDocumentsProps {
  organisationId: string;
  registrationId: string;
  canWrite: boolean;
}

// Each child's handed-in documents to review, handing in on behalf or on paper, and Internal documents.
export function RegistrationDocuments({ organisationId, registrationId, canWrite }: RegistrationDocumentsProps) {
  const { t } = useTranslation('participants');
  const documents = useRegistrationDocumentsQuery(organisationId, registrationId);
  const action = useDocumentReview(organisationId, registrationId, (run: () => Promise<unknown>) => run());
  // A link to open by hand when the browser blocked the new tab.
  const [blocked, setBlocked] = useState<string | null>(null);
  // One action at a time for the whole card, each reading the documents again when it settles.
  const run = (job: () => Promise<unknown>, onSuccess?: () => void) => action.mutate(job, { onSuccess });

  if (documents.isError) {
    return (
      <Alert variant="danger" role="alert">
        <CircleAlertIcon aria-hidden="true" />
        {t('documents.loadFailed')}
      </Alert>
    );
  }

  if (documents.data === undefined) {
    return null;
  }

  const { requirements, participants } = documents.data;

  return (
    <Card>
      <CardTitle>{t('documents.title')}</CardTitle>
      {participants.map((participant) => (
        <div key={participant.id} className="flex flex-col gap-3">
          {participants.length > 1 ? (
            <h3 className="text-[13px] font-medium text-muted-foreground">
              {t('name', { first: participant.firstName, last: participant.lastName })}
            </h3>
          ) : null}
          {requirements.length === 0 ? null : (
            <ul className="flex flex-col divide-y divide-border-subtle text-sm">
              {requirements.map((requirement) => (
                <DocumentRequirement
                  key={requirement.id}
                  organisationId={organisationId}
                  params={{ registrationId, participantId: participant.id, documentTypeId: requirement.id }}
                  name={requirement.name}
                  uploads={participant.uploads[requirement.id] ?? []}
                  canWrite={canWrite}
                  run={run}
                  isBusy={action.isPending}
                />
              ))}
            </ul>
          )}
          <InternalDocuments
            organisationId={organisationId}
            registrationId={registrationId}
            participantId={participant.id}
            documents={participant.internal}
            canWrite={canWrite}
            run={run}
            isBusy={action.isPending}
            onBlocked={setBlocked}
          />
        </div>
      ))}
      {action.isError ? <p className="text-sm text-destructive">{t('documents.actionFailed')}</p> : null}
      {blocked === null ? null : (
        <a
          href={blocked}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold underline"
        >
          <ExternalLinkIcon aria-hidden="true" className="size-4" />
          {t('documents.openBlocked')}
        </a>
      )}
    </Card>
  );
}
