import { Navigate } from '@tanstack/react-router';
import { CircleAlertIcon, LockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '@/core/participant-list';
import { RegistrationDocuments } from '@/features/participants/components/documents/registration-documents';
import { AdminActions } from '@/features/participants/components/editing/admin-actions';
import { RegistrationConsents } from '@/features/participants/components/registration-consents';
import { BackToList } from '@/features/participants/components/registration-detail/back-to-list';
import { DeclarationsCard } from '@/features/participants/components/registration-detail/declarations-card';
import { DetailSkeleton } from '@/features/participants/components/registration-detail/detail-skeleton';
import { GuardiansCard } from '@/features/participants/components/registration-detail/guardians-card';
import { HistoryCard } from '@/features/participants/components/registration-detail/history-card';
import { InvoiceRequestCard } from '@/features/participants/components/registration-detail/invoice-request-card';
import { MoreActions } from '@/features/participants/components/registration-detail/more-actions';
import { ParticipantCards } from '@/features/participants/components/registration-detail/participant-cards';
import { PaymentsCard } from '@/features/participants/components/registration-detail/payments-card';
import { PrihlaskaPdf } from '@/features/participants/components/registration-detail/prihlaska-pdf';
import { useRegistrationDetailPage } from '@/features/participants/components/use-registration-detail-page.hook';

interface RegistrationDetailPageProps {
  registrationId: string;
}

// Everything about one Registration for an admin answering a guardian; read access sees it all read-only.
export function RegistrationDetailPage({ registrationId }: RegistrationDetailPageProps) {
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

  if (page.detail === undefined) {
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
          submitted: t(`detail.submitted.${detail.source}`, { date: czechDateTime(detail.submittedAt) }),
          children: t('children', { count: detail.participants.length }),
          version: detail.formVersion,
        })}
        actions={
          <>
            <PrihlaskaPdf participants={detail.participants} />
            {page.canWrite ? (
              <Button type="button" variant="outline" aria-expanded={page.isEditing} onClick={page.toggleEditing}>
                {t('detail.edit')}
              </Button>
            ) : null}
            <MoreActions
              organisationId={page.organisationId}
              detail={detail}
              canWrite={page.canWrite}
              canErase={page.canErase}
              others={page.others}
              onRegenerate={page.regenerate}
            />
          </>
        }
      />
      {page.isRegenerating ? (
        <Alert variant="success">
          <output>{t('controls.regenerating')}</output>
        </Alert>
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          {page.canWrite && page.isEditing ? (
            <AdminActions organisationId={page.organisationId} detail={detail} canWriteHealth={page.canWriteHealth} />
          ) : null}
          <ParticipantCards
            {...shared}
            detail={detail}
            canWrite={page.canWrite}
            onVerify={page.verify}
            isVerifying={page.isVerifying}
          />
          <GuardiansCard {...shared} detail={detail} canWrite={page.canWrite} />
          <RegistrationConsents {...shared} />
          <RegistrationDocuments {...shared} canWrite={page.canWrite} />
          <DeclarationsCard declarations={detail.declarations} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <PaymentsCard {...shared} detail={detail} canWrite={page.canWrite} />
          <InvoiceRequestCard organisationId={page.organisationId} detail={detail} canWrite={page.canWrite} />
          <HistoryCard history={page.history} />
        </div>
      </div>
    </div>
  );
}
