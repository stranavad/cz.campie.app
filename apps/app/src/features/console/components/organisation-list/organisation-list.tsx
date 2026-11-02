import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { OrganisationRow } from '@/features/console/components/organisation-list/organisation-row';

interface OrganisationListProps {
  organisations: readonly ConsoleOrganisation[];
}

export function OrganisationList({ organisations }: OrganisationListProps) {
  const { t } = useTranslation('console');

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{t('organisations.title')}</h1>
      {organisations.length === 0 ? (
        <p className="text-muted-foreground">{t('organisations.empty')}</p>
      ) : (
        <ul>
          {organisations.map((organisation) => (
            <OrganisationRow key={organisation.id} organisation={organisation} />
          ))}
        </ul>
      )}
    </section>
  );
}
