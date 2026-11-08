import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminUpload, ChildRequirementParams } from '@repo/schema/documents';

import { FileButton } from '@/components/file-button';
import { Button } from '@/components/ui/button';
import { participantsService } from '@/features/participants/api/participants.service';
import { DocumentReturnForm } from '@/features/participants/components/documents/document-return-form';
import { DocumentStatusBadge } from '@/features/participants/components/documents/document-status-badge';
import { DocumentUploadLine } from '@/features/participants/components/documents/document-upload-line';

interface DocumentRequirementProps {
  organisationId: string;
  params: ChildRequirementParams;
  name: string;
  // Newest first.
  uploads: AdminUpload[];
  canWrite: boolean;
  run: (job: () => Promise<unknown>, onSuccess?: () => void) => void;
  isBusy: boolean;
}

// One required document of a child: its state, the review of the newest hand-in, every hand-in, and handing
// in on the family's behalf or on paper.
export function DocumentRequirement({
  organisationId,
  params,
  name,
  uploads,
  canWrite,
  run,
  isBusy,
}: DocumentRequirementProps) {
  const { t } = useTranslation('participants');
  const [isReturning, setReturning] = useState(false);
  const [newest] = uploads;
  const canReview = canWrite && newest !== undefined;

  return (
    <li className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{name}</span>
        <DocumentStatusBadge status={newest?.status ?? 'missing'} />
      </div>
      {uploads.length === 0 ? null : (
        <ul className="flex flex-col gap-1">
          {uploads.map((upload) => (
            <DocumentUploadLine key={upload.id} upload={upload} />
          ))}
        </ul>
      )}
      {canReview && newest.status !== 'returned' ? (
        <div className="flex flex-wrap gap-2">
          {newest.status === 'pending' ? (
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={() => run(() => participantsService.approveDocument(organisationId, newest.id))}
            >
              {t('documents.approve')}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-expanded={isReturning}
            onClick={() => setReturning(true)}
          >
            {t('documents.return')}
          </Button>
        </div>
      ) : null}
      {canReview && isReturning && newest.status !== 'returned' ? (
        <DocumentReturnForm
          isBusy={isBusy}
          onReturn={(note) =>
            run(
              () => participantsService.returnDocument(organisationId, newest.id, note),
              () => setReturning(false),
            )
          }
        />
      ) : null}
      {canWrite && newest?.status !== 'approved' ? (
        <div className="flex flex-wrap gap-2">
          <FileButton
            size="sm"
            accept="application/pdf,image/jpeg,image/png"
            label={t('documents.onBehalf')}
            disabled={isBusy}
            onFile={(file) => run(() => participantsService.uploadDocumentOnBehalf(organisationId, params, file))}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => run(() => participantsService.markDocumentOnPaper(organisationId, params))}
          >
            {t('documents.markPaper')}
          </Button>
        </div>
      ) : null}
    </li>
  );
}
