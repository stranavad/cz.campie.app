import { useTranslation } from 'react-i18next';

import type { GuardianUpload } from '@repo/schema/documents';
import { czechDateTime } from '@repo/schema/shared';

import { UploadTiles } from '@/features/portal/components/documents/upload-tiles';
import { useRequirementUploads } from '@/features/portal/components/documents/use-requirement-uploads.hook';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface RequirementUploadsProps {
  registrationId: string;
  participantId: string;
  documentTypeId: string;
  uploads: readonly GuardianUpload[];
}

// One child's documents for one requirement: why it was returned, handing in (again), and what was handed in.
export function RequirementUploads(props: RequirementUploadsProps) {
  const { t } = useTranslation('portal');
  const { newest, canUpload, replacing, isUploading, tooLarge, choose, failure } = useRequirementUploads(props);

  return (
    <div className="flex flex-col gap-3">
      {newest?.status === 'returned' && newest.note !== null ? (
        <div className="flex flex-col gap-1 rounded-2xl bg-muted px-3.5 py-3">
          <span className="text-[13px] font-bold text-muted-foreground">{t('documents.campNote')}</span>
          <p className="text-[15px] whitespace-pre-line">{newest.note}</p>
        </div>
      ) : null}
      {canUpload ? (
        <>
          {replacing === null ? null : <p className="text-sm text-muted-foreground">{t('documents.replaceNote')}</p>}
          <UploadTiles disabled={isUploading} onChoose={choose} />
        </>
      ) : null}
      {isUploading ? <output className="block text-sm text-muted-foreground">{t('documents.uploading')}</output> : null}
      {tooLarge ? <StatusMessage tone="danger">{t('documents.fileProblems.file_too_large')}</StatusMessage> : null}
      {failure === null ? null : <StatusMessage tone="danger">{t(`documents.${failure}`)}</StatusMessage>}
      {props.uploads.length === 0 ? null : (
        <ul className="flex flex-col divide-y divide-border-subtle text-sm">
          {props.uploads.map((handedIn) => (
            <li key={handedIn.id} className="flex min-h-11 items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {t('documents.handedIn', { date: czechDateTime(handedIn.uploadedAt) })}
              </span>
              {handedIn.file === null ? (
                <span className="text-muted-foreground">{t('documents.onPaper')}</span>
              ) : (
                <a
                  href={handedIn.file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center font-semibold underline underline-offset-4"
                >
                  {t('documents.open')}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
