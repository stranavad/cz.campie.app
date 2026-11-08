import { Navigate } from '@tanstack/react-router';
import { CalendarXIcon, LockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { ParticipantFilters } from '@/features/participants/components/participant-list/participant-filters';
import { ParticipantList } from '@/features/participants/components/participant-list/participant-list';
import { ParticipantsActions } from '@/features/participants/components/participant-list/participants-actions';
import { ParticipantsPanelCard } from '@/features/participants/components/participant-list/participants-panel-card';
import { ParticipantsSkeleton } from '@/features/participants/components/participant-list/participants-skeleton';
import { TurnusOverview } from '@/features/participants/components/turnus-overview';
import { useParticipantsPage } from '@/features/participants/components/use-participants-page.hook';

// The admin's working list: the Participants of the Selected Turnus, searched and filtered.
export function ParticipantsPage() {
  const { t } = useTranslation('participants');
  const page = useParticipantsPage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <ParticipantsSkeleton />;
  }

  if (page.hasNoAccess) {
    return <EmptyState icon={<LockIcon />} title={t('noAccess')} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title={t('title')}
        actions={
          <ParticipantsActions
            canWrite={page.canWrite}
            hasTurnus={page.turnusId !== null}
            panel={page.panel}
            onToggle={page.togglePanel}
          />
        }
      />
      {page.hasNoTurnusy ? <EmptyState icon={<CalendarXIcon />} title={t('noTurnusy')} /> : null}
      {page.turnusId === null ? null : (
        <>
          {page.panel === null ? null : (
            <ParticipantsPanelCard
              key={page.turnusId}
              panel={page.panel}
              organisationId={page.organisationId}
              turnusId={page.turnusId}
              campId={page.campId}
              onClose={() => page.togglePanel(null)}
            />
          )}
          <TurnusOverview
            key={`overview-${page.turnusId}`}
            organisationId={page.organisationId}
            turnusId={page.turnusId}
          />
          <ParticipantFilters
            search={page.search}
            onSearch={page.setSearch}
            paymentStatus={page.paymentStatus}
            onPaymentStatus={page.setPaymentStatus}
            flags={page.flags}
            onToggleFlag={page.toggleFlag}
          />
          <ParticipantList
            rows={page.rows}
            isLoading={page.isListLoading}
            isEmpty={page.isEmpty}
            isStale={page.isStale}
            isError={page.isError}
          />
        </>
      )}
    </div>
  );
}
