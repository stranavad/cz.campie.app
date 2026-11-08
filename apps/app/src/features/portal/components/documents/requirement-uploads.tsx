import { useTranslation } from 'react-i18next';

import type { GuardianUpload } from '@repo/schema/documents';
import { czechDateTime } from '@repo/schema/shared';

import { buttonVariants } from '@/components/ui/button';
import { FileUploadButton } from '@/features/portal/components/documents/file-upload-button';
import { useRequirementUploads } from '@/features/portal/components/documents/use-requirement-uploads.hook';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface RequirementUploadsProps {
  registrationId: string;
  participantId: string;
  documentTypeId: string;
  uploads: readonly GuardianUpload[];
}

// One child's documents for one requirement: why it was returned, what was handed in, and handing in again.
export function RequirementUploads(props: RequirementUploadsProps) {
  const { t } = useTranslation('portal');
  const { newest, canUpload, replacing, isUploading, tooLarge, choose, failure } = useRequirementUploads(props);

  return (
    <div className="flex flex-col gap-3">
      {newest?.status === 'returned' && newest.note !== null ? (
        <p className="rounded-2xl bg-muted px-4 py-3 text-[15px]">
          {t('documents.returnedNote', { note: newest.note })}
        </p>
      ) : null}
      {props.uploads.length === 0 ? null : (
        <ul className="flex flex-col divide-y divide-border-subtle text-sm">
          {props.uploads.map((handedIn) => (
            <li key={handedIn.id} className="flex min-h-11 items-center justify-between gap-3 py-1">
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
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  {t('documents.open')}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {canUpload ? (
        <FileUploadButton
          label={
            replacing !== null
              ? t('documents.replace')
              : newest === undefined
                ? t('documents.upload')
                : t('documents.uploadAgain')
          }
          hint={t('documents.uploadHint')}
          primary={replacing === null}
          disabled={isUploading}
          onChoose={choose}
        />
      ) : null}
      {isUploading ? <output className="block text-sm text-muted-foreground">{t('documents.uploading')}</output> : null}
      {tooLarge ? <StatusMessage tone="danger">{t('documents.fileProblems.file_too_large')}</StatusMessage> : null}
      {failure === null ? null : <StatusMessage tone="danger">{t(`documents.${failure}`)}</StatusMessage>}
    </div>
  );
}
