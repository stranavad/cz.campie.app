import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { CAMP_PHOTO_CONTENT_TYPES } from '@repo/schema/camps';

import { FileButton } from '@/components/file-button';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CampPhotoPreview } from '@/features/camps/components/camp-form/camp-photo-preview';
import { useCampPhotoField } from '@/features/camps/components/camp-form/use-camp-photo-field.hook';

interface CampPhotoFieldProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's photo for its card and the top of its page, uploaded as soon as it is chosen and shown from a
// short-lived link.
export function CampPhotoField({ organisationId, campId, canWrite }: CampPhotoFieldProps) {
  const { t } = useTranslation('camps');
  const hintId = useId();
  const field = useCampPhotoField(organisationId, campId);
  const isLocked = !canWrite || field.isBusy;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold">{t('photo.title')}</span>
      <CampPhotoPreview photo={field.photo} isLoading={field.isLoading} />
      {field.isError ? (
        <Alert variant="danger" role="alert">
          {t('photo.loadFailed')}
        </Alert>
      ) : null}
      {canWrite ? (
        <div className="flex flex-col gap-2">
          <span id={hintId} className="text-[13px] text-muted-foreground">
            {t('photo.hint')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <FileButton
              label={field.photo === null ? t('photo.upload') : t('photo.replace')}
              accept={CAMP_PHOTO_CONTENT_TYPES.join(',')}
              describedBy={hintId}
              disabled={isLocked}
              onFile={field.upload}
            />
            {field.photo === null ? null : (
              <Button type="button" variant="ghost" disabled={isLocked} onClick={field.remove}>
                {t('photo.remove')}
              </Button>
            )}
          </div>
        </div>
      ) : null}
      {field.failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`photo.failure.${field.failure}`)}
        </Alert>
      )}
    </div>
  );
}
