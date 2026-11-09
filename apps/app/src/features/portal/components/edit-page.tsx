import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { useGuardianEditQuery } from '@/features/portal/api/portal.queries';
import { EditForm } from '@/features/portal/components/edit/edit-form';
import { PortalBackHeader } from '@/features/portal/components/shared/portal-back-header';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { HttpError } from '@/lib/api';

// What a guardian may change on a Registration until the camp's lock date, and what they only see.
export function EditPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('portal');
  const edit = useGuardianEditQuery(registrationId);

  if (edit.error instanceof HttpError && edit.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (edit.isPending) {
    return null;
  }

  return (
    <PortalColumn className="gap-3">
      <PortalBackHeader title={t('edit.title')} />
      {edit.isError ? (
        <Alert variant="danger" role="alert">
          {t('error')}
        </Alert>
      ) : (
        <EditForm registrationId={registrationId} edit={edit.data} />
      )}
    </PortalColumn>
  );
}
