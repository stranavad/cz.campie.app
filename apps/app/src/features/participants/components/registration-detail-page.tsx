import { Navigate } from '@tanstack/react-router';
import { CircleAlertIcon, LockIcon, PencilIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RegistrationDocuments } from '@/features/participants/components/documents/registration-documents';
import { AdminActions } from '@/features/participants/components/editing/admin-actions';
import { EraseRegistration } from '@/features/participants/components/erase-registration';
import { PaymentStatusBadge } from '@/features/participants/components/payment-status-badge';
import { RegistrationConsents } from '@/features/participants/components/registration-consents';
import { RegistrationControls } from '@/features/participants/components/registration-controls';
import { BackToList } from '@/features/participants/components/registration-detail/back-to-list';
import { DeclarationsCard } from '@/features/participants/components/registration-detail/declarations-card';
import { DetailSkeleton } from '@/features/participants/components/registration-detail/detail-skeleton';
import { GuardiansCard } from '@/features/participants/components/registration-detail/guardians-card';
import { HistoryCard } from '@/features/participants/components/registration-detail/history-card';
import { ParticipantDetailCard } from '@/features/participants/components/registration-detail/participant-detail-card';
import { PaymentsCard } from '@/features/participants/components/registration-detail/payments-card';
import { useRegistrationDetailPage } from '@/features/participants/components/use-registration-detail-page.hook';

// Everything about one Registration for an admin answering a guardian; read access sees it all read-only.
export function RegistrationDetailPage({ registrationId }: { registrationId: string }) {
  const { t } = useTranslation('participants');
  const page = useRegistrationDetailPage(registrationId);

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <DetailSkeleton />;
  }

  if (page.hasNoAccess) {
    return <EmptyState icon={<LockIcon />} title={t('noAccess')} />;
  }

  if (page.isError || page.detail === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <BackToList />
        <Alert variant="danger" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          {t('detail.error')}
        </Alert>
      </div>
    );
  }

  const { detail } = page;
  const shared = { organisationId: page.organisationId, registrationId };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={<BackToList turnus={detail.turnus.name} />}
        title={page.title}
        status={
          <>
            <PaymentStatusBadge status={detail.ledger.status} />
            {detail.ledger.overdue ? <Badge variant="danger">{t('filters.overdue')}</Badge> : null}
          </>
        }
        description={t('detail.subtitle', {
          symbol: detail.variableSymbol,
          camp: detail.camp.name,
          turnus: detail.turnus.name,
          date: czechDateTime(detail.submittedAt),
          version: detail.formVersion,
        })}
        actions={
          page.canWrite ? (
            <Button type="button" variant="outline" aria-expanded={page.isEditing} onClick={page.toggleEditing}>
              <PencilIcon aria-hidden="true" />
              {t('detail.edit')}
            </Button>
          ) : undefined
        }
      />
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          {page.canWrite && page.isEditing ? (
            <AdminActions organisationId={page.organisationId} detail={detail} canWriteHealth={page.canWriteHealth} />
          ) : null}
          {detail.participants.map((participant) => (
            <ParticipantDetailCard
              key={participant.id}
              participant={participant}
              discounts={detail.claimedDiscounts.filter(({ participantId }) => participantId === participant.id)}
              canWrite={page.canWrite}
              onVerify={(fieldId, optionId) => page.verify(participant.id, fieldId, optionId)}
              isVerifying={page.isVerifying}
            />
          ))}
          <GuardiansCard {...shared} detail={detail} canWrite={page.canWrite} />
          <DeclarationsCard declarations={detail.declarations} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <PaymentsCard {...shared} detail={detail} canWrite={page.canWrite} />
          <RegistrationConsents {...shared} />
          <RegistrationDocuments {...shared} canWrite={page.canWrite} />
          {page.canWrite ? <RegistrationControls organisationId={page.organisationId} detail={detail} /> : null}
          {page.isOwner && detail.guardians.length > 0 ? <EraseRegistration {...shared} /> : null}
          <HistoryCard history={page.history} />
        </div>
      </div>
    </div>
  );
}
