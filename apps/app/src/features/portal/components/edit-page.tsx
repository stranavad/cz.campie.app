import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { useGuardianEditQuery } from '@/features/portal/api/portal.queries';
import { AddGuardianCard } from '@/features/portal/components/edit/add-guardian-card';
import { GuardianCard } from '@/features/portal/components/edit/guardian-card';
import { NewFieldsCard } from '@/features/portal/components/edit/new-fields-card';
import { RemovedAnswers } from '@/features/portal/components/edit/removed-answers';
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

  if (edit.isError) {
    return (
      <PortalColumn>
        <PortalBackHeader title={t('edit.title')} />
        <Alert variant="danger" role="alert">
          {t('error')}
        </Alert>
      </PortalColumn>
    );
  }

  const { data } = edit;

  return (
    <PortalColumn className="gap-3">
      <PortalBackHeader title={t('edit.title')} />
      {data.editable ? (
        data.lockDate === null ? null : (
          <Alert>{t('edit.until', { date: czechDate(data.lockDate) })}</Alert>
        )
      ) : (
        <Alert variant="warning">
          <output>{t('edit.readOnly')}</output>
        </Alert>
      )}
      {data.guardians.map((guardian) => (
        <GuardianCard
          key={`${guardian.position}-${guardian.email}`}
          registrationId={registrationId}
          guardian={guardian}
          editable={data.editable}
        />
      ))}
      {data.editable && data.guardians.length < 2 ? <AddGuardianCard registrationId={registrationId} /> : null}
      <NewFieldsCard registrationId={registrationId} edit={data} />
      <RemovedAnswers removed={data.removed} />
    </PortalColumn>
  );
}
