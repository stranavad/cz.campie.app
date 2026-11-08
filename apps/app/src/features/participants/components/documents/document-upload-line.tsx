import { useTranslation } from 'react-i18next';

import type { AdminUpload } from '@repo/schema/documents';
import { czechDateTime } from '@repo/schema/shared';

// One hand-in: when and by whom, its state and note, and its file or that it came on paper.
export function DocumentUploadLine({ upload }: { upload: AdminUpload }) {
  const { t } = useTranslation('participants');

  return (
    <li className="flex flex-wrap gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
      <span>
        {t('documents.handedIn', {
          date: czechDateTime(upload.uploadedAt),
          by: upload.byAdmin ? t('documents.byAdmin') : (upload.uploadedBy ?? ''),
        })}
      </span>
      <span>{t(`documents.statuses.${upload.status}`)}</span>
      {upload.note === null ? null : <span className="text-foreground">{upload.note}</span>}
      {upload.file === null ? (
        <span>{t('documents.onPaper')}</span>
      ) : (
        <a href={upload.file.url} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline">
          {t('documents.open')}
        </a>
      )}
    </li>
  );
}
