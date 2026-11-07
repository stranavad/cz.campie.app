import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminUpload } from '@repo/schema/documents';
import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDocumentReview, useRegistrationDocumentsQuery } from '@/features/participants/api/participants.queries';
import { participantsService } from '@/features/participants/api/participants.service';

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
  const [returning, setReturning] = useState<{ uploadId: string; note: string } | null>(null);

  if (documents.isError) {
    return <p className="text-sm text-destructive">{t('documents.loadFailed')}</p>;
  }

  if (documents.data === undefined) {
    return null;
  }

  const { requirements, participants } = documents.data;
  const latestActions = (upload: AdminUpload) =>
    !canWrite ? null : (
      <span className="flex flex-wrap gap-2">
        {upload.status === 'pending' ? (
          <Button
            type="button"
            size="sm"
            disabled={action.isPending}
            onClick={() => action.mutate(() => participantsService.approveDocument(organisationId, upload.id))}
          >
            {t('documents.approve')}
          </Button>
        ) : null}
        {upload.status !== 'returned' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setReturning({ uploadId: upload.id, note: '' })}
          >
            {t('documents.return')}
          </Button>
        ) : null}
      </span>
    );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('documents.title')}</h2>
      {participants.map((participant) => (
        <div key={participant.id} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            {t('name', { first: participant.firstName, last: participant.lastName })}
          </h3>
          <ul className="flex flex-col divide-y rounded-lg border text-sm">
            {requirements.map((requirement) => {
              const uploads = participant.uploads[requirement.id] ?? [];
              const [newest] = uploads;
              const params = { registrationId, participantId: participant.id, documentTypeId: requirement.id };

              return (
                <li key={requirement.id} className="flex flex-col gap-2 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{requirement.name}</span>
                    <span className={newest?.status === 'approved' ? '' : 'text-destructive'}>
                      {t(`documents.statuses.${newest?.status ?? 'missing'}`)}
                    </span>
                    {newest === undefined ? null : latestActions(newest)}
                  </div>
                  {returning !== null && returning.uploadId === newest?.id ? (
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="flex flex-1 flex-col gap-1">
                        {t('documents.returnNote')}
                        <Input
                          value={returning.note}
                          onChange={(event) => setReturning({ ...returning, note: event.target.value })}
                        />
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        disabled={returning.note.trim() === '' || action.isPending}
                        onClick={() =>
                          action.mutate(
                            () =>
                              participantsService.returnDocument(organisationId, returning.uploadId, returning.note),
                            { onSuccess: () => setReturning(null) },
                          )
                        }
                      >
                        {t('documents.returnConfirm')}
                      </Button>
                    </div>
                  ) : null}
                  {uploads.map((upload) => (
                    <span key={upload.id} className="flex flex-wrap gap-2 text-muted-foreground">
                      {t('documents.handedIn', {
                        date: czechDateTime(upload.uploadedAt),
                        by: upload.byAdmin ? t('documents.byAdmin') : (upload.uploadedBy ?? ''),
                      })}
                      <span>{t(`documents.statuses.${upload.status}`)}</span>
                      {upload.note === null ? null : <span>{upload.note}</span>}
                      {upload.file === null ? (
                        <span>{t('documents.onPaper')}</span>
                      ) : (
                        <a href={upload.file.url} target="_blank" rel="noreferrer" className="underline">
                          {t('documents.open')}
                        </a>
                      )}
                    </span>
                  ))}
                  {canWrite && newest?.status !== 'approved' ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex flex-col gap-1">
                        {t('documents.onBehalf')}
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png"
                          disabled={action.isPending}
                          onChange={(event) => {
                            const file = event.target.files?.[0];

                            if (file !== undefined) {
                              action.mutate(() =>
                                participantsService.uploadDocumentOnBehalf(organisationId, params, file),
                              );
                            }

                            event.target.value = '';
                          }}
                        />
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={action.isPending}
                        onClick={() =>
                          action.mutate(() => participantsService.markDocumentOnPaper(organisationId, params))
                        }
                      >
                        {t('documents.markPaper')}
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t('documents.internal')}</span>
            {participant.internal.length === 0 ? (
              <span className="text-muted-foreground">{t('documents.noInternal')}</span>
            ) : null}
            {participant.internal.map((document) => (
              <span key={document.id} className="flex flex-wrap items-center gap-2">
                <a href={document.file.url} target="_blank" rel="noreferrer" className="underline">
                  {document.name}
                </a>
                <span className="text-muted-foreground">{czechDateTime(document.uploadedAt)}</span>
                {canWrite ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate(() => participantsService.removeInternalDocument(organisationId, document.id))
                    }
                  >
                    {t('documents.removeInternal')}
                  </Button>
                ) : null}
              </span>
            ))}
            {canWrite ? (
              <label className="flex flex-col gap-1">
                {t('documents.addInternal')}
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  disabled={action.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file !== undefined) {
                      action.mutate(() =>
                        participantsService.addInternalDocument(organisationId, registrationId, participant.id, file),
                      );
                    }

                    event.target.value = '';
                  }}
                />
              </label>
            ) : null}
          </div>
        </div>
      ))}
      {action.isError ? <p className="text-sm text-destructive">{t('documents.actionFailed')}</p> : null}
    </section>
  );
}
