import { ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { FileLink } from '@repo/schema/files';

import { Skeleton } from '@/components/ui/skeleton';

interface CampPhotoPreviewProps {
  photo: FileLink | null;
  isLoading: boolean;
}

const FRAME =
  'flex aspect-video w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-subtle-foreground';

// The Camp's photo in the shape guardians see it, so nothing jumps while it loads.
export function CampPhotoPreview({ photo, isLoading }: CampPhotoPreviewProps) {
  const { t } = useTranslation('camps');

  if (isLoading) {
    return <Skeleton className="aspect-video w-full max-w-sm rounded-2xl" />;
  }

  if (photo === null) {
    return (
      <div className={FRAME}>
        <span className="flex flex-col items-center gap-2 text-sm">
          <ImageIcon aria-hidden="true" className="size-6" />
          {t('photo.empty')}
        </span>
      </div>
    );
  }

  return (
    <div className={FRAME}>
      <img src={photo.url} alt={t('photo.current')} className="size-full object-cover" />
    </div>
  );
}
