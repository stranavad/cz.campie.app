import { useState } from 'react';

import type { GuardianUpload } from '@repo/schema/documents';
import { FILE_ERROR_CODES, MAX_FILE_BYTES } from '@repo/schema/files';

import { useUploadDocumentMutation } from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

interface RequirementUploadsParams {
  registrationId: string;
  participantId: string;
  documentTypeId: string;
  uploads: readonly GuardianUpload[];
}

/**
 * Handing in one child's document for one requirement: whether it can be handed in or swapped, and why it failed.
 * @param params the requirement, the child and what was handed in, newest first
 */
export function useRequirementUploads({
  registrationId,
  participantId,
  documentTypeId,
  uploads,
}: RequirementUploadsParams) {
  const upload = useUploadDocumentMutation(registrationId);
  // Too large to send at all: told at once rather than after the upload.
  const [tooLarge, setTooLarge] = useState(false);
  const [newest] = uploads;
  // A document waiting for review, such as a wrong photo, may be swapped for another until it is reviewed.
  const replacing = newest?.status === 'pending' && newest.file !== null ? newest.id : null;
  const refusal = upload.error instanceof HttpError ? readErrorResponse(upload.error.details)?.code : undefined;
  const fileProblem = FILE_ERROR_CODES.find((known) => known === refusal);

  return {
    newest,
    canUpload: newest === undefined || newest.status === 'returned' || replacing !== null,
    replacing,
    isUploading: upload.isPending,
    tooLarge,
    choose: (file: File | undefined) => {
      setTooLarge(file !== undefined && file.size > MAX_FILE_BYTES);

      if (file !== undefined && file.size <= MAX_FILE_BYTES) {
        upload.mutate({ params: { registrationId, participantId, documentTypeId }, file, replacing });
      }
    },
    failure: upload.isError
      ? refusal === 'document_upload_not_needed'
        ? ('notNeeded' as const)
        : refusal === 'document_upload_not_pending'
          ? ('notPending' as const)
          : fileProblem === undefined
            ? ('uploadFailed' as const)
            : (`fileProblems.${fileProblem}` as const)
      : null,
  };
}
