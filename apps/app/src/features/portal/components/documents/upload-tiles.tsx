import { CameraIcon, FileUpIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { FileButton } from '@/components/file-button';
import { FILE_ACCEPT, PHOTO_ACCEPT } from '@/features/portal/components/documents/upload-tiles.constant';

interface UploadTilesProps {
  disabled: boolean;
  onChoose: (file: File) => void;
}

const TILE = 'h-22 w-full flex-col gap-1.5 rounded-[20px] px-2 text-center whitespace-normal [&_svg]:size-6';

// Handing a document in from a phone: a photo taken straight away, or a file already on it; the allowed
// types and size under them.
export function UploadTiles({ disabled, onChoose }: UploadTilesProps) {
  const { t } = useTranslation('portal');
  const hintId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-2">
        <FileButton
          label={t('documents.takePhoto')}
          icon={<CameraIcon aria-hidden="true" />}
          variant="brand"
          accept={PHOTO_ACCEPT}
          capture="environment"
          disabled={disabled}
          describedBy={hintId}
          onFile={onChoose}
          className={TILE}
        />
        <FileButton
          label={t('documents.chooseFile')}
          icon={<FileUpIcon aria-hidden="true" />}
          variant="outline"
          accept={FILE_ACCEPT}
          disabled={disabled}
          describedBy={hintId}
          onFile={onChoose}
          className={TILE}
        />
      </div>
      <p id={hintId} className="text-center text-[13px] text-muted-foreground">
        {t('documents.uploadHint')}
      </p>
    </div>
  );
}
