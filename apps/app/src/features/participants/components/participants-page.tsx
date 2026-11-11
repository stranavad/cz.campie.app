import { CalendarXIcon, CircleAlertIcon, LockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { LoginRedirect } from '@/core/account';
import { ParticipantFilters } from '@/features/participants/components/participant-list/participant-filters';
import { ParticipantList } from '@/features/participants/components/participant-list/participant-list';
import { ParticipantsActions } from '@/features/participants/components/participant-list/participants-actions';
import { ParticipantsPanelCard } from '@/features/participants/components/participant-list/participants-panel-card';
import { ParticipantsSkeleton } from '@/features/participants/components/participant-list/participants-skeleton';
import type { ParticipantsSearch } from '@/features/participants/components/participants-search.constant';
import { useParticipantsPage } from '@/features/participants/components/use-participants-page.hook';

interface ParticipantsPageProps {
  search: ParticipantsSearch;
  onSearch: (search: ParticipantsSearch) => void;
}

// The admin's working list: the Participants of the Selected Turnus by payment, searched and filtered.
export function ParticipantsPage({ search, onSearch }: ParticipantsPageProps) {
  const { t } = useTranslation('participants');
  const page = useParticipantsPage(search, onSearch);

  if (page.isSignedOut) {
    return <LoginRedirect />;
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
      {page.isTurnusError ? (
        <Alert variant="danger" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          {t('error')}
        </Alert>
      ) : null}
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
          <ParticipantFilters
            text={page.text}
            onText={page.setText}
            tab={page.tab}
            onTab={page.setTab}
            countOf={page.countOf}
            checks={page.checks}
            onToggleCheck={page.toggleCheck}
            invoice={page.invoice}
            onInvoice={page.setInvoice}
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
