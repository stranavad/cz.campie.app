import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GuardianUpload } from '@repo/schema/documents';
import { FILE_ERROR_CODES, MAX_FILE_BYTES } from '@repo/schema/files';
import { czechDateTime } from '@repo/schema/shared';

import { useUploadDocumentMutation } from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

interface RequirementUploadsProps {
  registrationId: string;
  participantId: string;
  documentTypeId: string;
  uploads: readonly GuardianUpload[];
}

// One child's documents for one requirement: the newest status, what was handed in, and handing in again.
export function RequirementUploads({
  registrationId,
  participantId,
  documentTypeId,
  uploads,
}: RequirementUploadsProps) {
  const { t } = useTranslation('portal');
  const upload = useUploadDocumentMutation(registrationId);
  // Too large to send at all: told at once rather than after the upload.
  const [tooLarge, setTooLarge] = useState(false);
  const [newest] = uploads;
  const canUpload = newest === undefined || newest.status === 'returned';
  // A document waiting for review, such as a wrong photo, may be swapped for another until it is reviewed.
  const replacing = newest?.status === 'pending' && newest.file !== null ? newest.id : null;
  const refusal = upload.error instanceof HttpError ? readErrorResponse(upload.error.details)?.code : undefined;
  const fileProblem = FILE_ERROR_CODES.find((known) => known === refusal);

  return (
    <div className="flex flex-col gap-2">
      <span className={newest?.status === 'approved' ? 'font-medium' : 'text-destructive'}>
        {newest === undefined ? t('documents.statuses.missing') : t(`documents.statuses.${newest.status}`)}
      </span>
      {newest?.status === 'returned' && newest.note !== null ? (
        <p>{t('documents.returnedNote', { note: newest.note })}</p>
      ) : null}
      {uploads.map((handedIn) => (
        <span key={handedIn.id} className="flex flex-wrap gap-2 text-muted-foreground">
          {t('documents.handedIn', { date: czechDateTime(handedIn.uploadedAt) })}
          {handedIn.file === null ? (
            <span>{t('documents.onPaper')}</span>
          ) : (
            <a href={handedIn.file.url} target="_blank" rel="noreferrer" className="underline">
              {t('documents.open')}
            </a>
          )}
        </span>
      ))}
      {canUpload || replacing !== null ? (
        <label className="flex flex-col gap-1">
          {replacing !== null
            ? t('documents.replace')
            : newest === undefined
              ? t('documents.upload')
              : t('documents.uploadAgain')}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            disabled={upload.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];

              setTooLarge(file !== undefined && file.size > MAX_FILE_BYTES);

              if (file !== undefined && file.size <= MAX_FILE_BYTES) {
                upload.mutate({ params: { registrationId, participantId, documentTypeId }, file, replacing });
              }

              event.target.value = '';
            }}
          />
          <span className="text-muted-foreground">{t('documents.uploadHint')}</span>
        </label>
      ) : null}
      {upload.isPending ? <span className="text-muted-foreground">{t('documents.uploading')}</span> : null}
      {tooLarge ? (
        <p role="alert" className="text-destructive">
          {t('documents.fileProblems.file_too_large')}
        </p>
      ) : null}
      {upload.isError ? (
        <p role="alert" className="text-destructive">
          {refusal === 'document_upload_not_needed'
            ? t('documents.notNeeded')
            : refusal === 'document_upload_not_pending'
              ? t('documents.notPending')
              : fileProblem === undefined
                ? t('documents.uploadFailed')
                : t(`documents.fileProblems.${fileProblem}`)}
        </p>
      ) : null}
    </div>
  );
}
