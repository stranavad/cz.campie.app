import { useState } from 'react';

import { FILE_ERROR_CODES, type FileErrorCode } from '@repo/schema/files';
import { MAX_LOGO_BYTES } from '@repo/schema/organisations';

import {
  useRemoveOrganisationLogoMutation,
  useSetOrganisationLogoMutation,
} from '@/features/organisation-settings/api/organisation-settings.queries';
import { HttpError } from '@/lib/api';

export type LogoFailure = FileErrorCode | 'unexpected';

export function useLogoField(organisationId: string) {
  const setLogo = useSetOrganisationLogoMutation(organisationId);
  const removeLogo = useRemoveOrganisationLogoMutation(organisationId);
  const [failure, setFailure] = useState<LogoFailure | null>(null);

  const fail = (error: unknown) => {
    const code = error instanceof HttpError ? error.code : undefined;

    setFailure(FILE_ERROR_CODES.find((known) => known === code) ?? 'unexpected');
  };

  // A file over the limit is refused here already, so it is not uploaded for nothing.
  const upload = (file: File) => {
    setFailure(null);

    if (file.size > MAX_LOGO_BYTES) {
      setFailure('file_too_large');

      return;
    }

    setLogo.mutate(file, { onError: fail });
  };

  const remove = () => {
    setFailure(null);
    removeLogo.mutate(undefined, { onError: fail });
  };

  return { upload, remove, failure, isBusy: setLogo.isPending || removeLogo.isPending };
}
