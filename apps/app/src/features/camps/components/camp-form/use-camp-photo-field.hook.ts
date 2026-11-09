import { useState } from 'react';

import { MAX_CAMP_PHOTO_BYTES } from '@repo/schema/camps';
import { FILE_ERROR_CODES, type FileErrorCode } from '@repo/schema/files';

import {
  useCampPhotoQuery,
  useRemoveCampPhotoMutation,
  useSetCampPhotoMutation,
} from '@/features/camps/api/camps.queries';
import { HttpError } from '@/lib/api';

export type CampPhotoFailure = FileErrorCode | 'unexpected';

export function useCampPhotoField(organisationId: string, campId: string) {
  const photo = useCampPhotoQuery(organisationId, campId);
  const setPhoto = useSetCampPhotoMutation(organisationId, campId);
  const removePhoto = useRemoveCampPhotoMutation(organisationId, campId);
  const [failure, setFailure] = useState<CampPhotoFailure | null>(null);

  const fail = (error: unknown) => {
    const code = error instanceof HttpError ? error.code : undefined;

    setFailure(FILE_ERROR_CODES.find((known) => known === code) ?? 'unexpected');
  };

  // A file over the limit is refused here already, so it is not uploaded for nothing.
  const upload = (file: File) => {
    setFailure(null);

    if (file.size > MAX_CAMP_PHOTO_BYTES) {
      setFailure('file_too_large');

      return;
    }

    setPhoto.mutate(file, { onError: fail });
  };

  const remove = () => {
    setFailure(null);
    removePhoto.mutate(undefined, { onError: fail });
  };

  return {
    photo: photo.data?.photo ?? null,
    isLoading: photo.isPending,
    isError: photo.isError,
    upload,
    remove,
    failure,
    isBusy: setPhoto.isPending || removePhoto.isPending,
  };
}
