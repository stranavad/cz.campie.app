import { Building2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { OrganisationRow } from '@/features/console/components/organisation-list/organisation-row';

interface OrganisationListProps {
  organisations: readonly ConsoleOrganisation[];
  // Awaiting approval: the operator's work.
  pendingCount: number;
}

export function OrganisationList({ organisations, pendingCount }: OrganisationListProps) {
  const { t } = useTranslation('console');

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-heading">{t('organisations.title')}</h2>
        {pendingCount === 0 ? null : (
          <Badge variant="warning">{t('organisations.pendingCount', { count: pendingCount })}</Badge>
        )}
      </div>
      {organisations.length === 0 ? (
        <EmptyState icon={<Building2Icon aria-hidden="true" />} title={t('organisations.empty')} />
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-3xl border border-border bg-card">
          {organisations.map((organisation) => (
            <OrganisationRow key={organisation.id} organisation={organisation} />
          ))}
        </ul>
      )}
    </section>
  );
}
