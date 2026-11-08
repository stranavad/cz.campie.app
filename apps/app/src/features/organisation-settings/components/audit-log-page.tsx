import { Navigate } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLogEntryRow } from '@/features/organisation-settings/components/audit-log/audit-log-entry-row';
import { AuditLogFilters } from '@/features/organisation-settings/components/audit-log/audit-log-filters';
import { useAuditLogPage } from '@/features/organisation-settings/components/audit-log/use-audit-log-page.hook';

// The Organisation's whole audit log for its Owners: who did what to which record, with old and new values.
export function AuditLogPage() {
  const { t } = useTranslation('organisationSettings');
  const page = useAuditLogPage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return null;
  }

  if (!page.isOwner) {
    return <Alert>{t('notOwner')}</Alert>;
  }

  return (
    <>
      <PageHeader title={t('auditLog.title')} description={t('auditLog.intro')} />
      <AuditLogFilters filters={page.filters} />
      {page.isError ? (
        <Alert variant="danger" role="alert">
          {t('auditLog.loadFailed')}
        </Alert>
      ) : null}
      {page.isPending && !page.isError ? <Skeleton className="h-64 rounded-3xl" /> : null}
      {page.isEmpty ? <EmptyState icon={<HistoryIcon />} title={t('auditLog.none')} /> : null}
      {page.days.map((day) => (
        <section key={day.date} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-bold text-muted-foreground">{day.label}</h2>
          <ul className="overflow-hidden rounded-3xl border border-border bg-card">
            {day.entries.map((entry) => (
              <AuditLogEntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
      {page.hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={page.isFetchingMore}
          onClick={page.loadMore}
        >
          {t('auditLog.more')}
        </Button>
      ) : null}
    </>
  );
}
