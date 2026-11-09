import { Building2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { EmptyState } from '@/components/empty-state';
import { SearchInput } from '@/components/search-input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrganisationTableRow } from '@/features/console/components/organisation-table/organisation-table-row';
import { useOrganisationTable } from '@/features/console/components/organisation-table/use-organisation-table.hook';

interface OrganisationTableProps {
  organisations: readonly ConsoleOrganisation[];
}

// Every Organisation as a compact row, awaiting approval first, with a search by name, IČO or address.
export function OrganisationTable({ organisations }: OrganisationTableProps) {
  const { t } = useTranslation('console');
  const table = useOrganisationTable(organisations);

  if (organisations.length === 0) {
    return <EmptyState icon={<Building2Icon aria-hidden="true" />} title={t('organisations.empty')} />;
  }

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <SearchInput
        className="max-w-md"
        aria-label={t('organisations.search')}
        placeholder={t('organisations.searchPlaceholder')}
        value={table.search}
        onChange={(event) => table.setSearch(event.target.value)}
      />
      {table.rows.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{t('organisations.noMatch')}</p>
      ) : (
        <Table className="min-w-[52rem]" aria-label={t('organisations.title')}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('organisations.organisation')}</TableHead>
              <TableHead>{t('fields.address')}</TableHead>
              <TableHead>{t('organisations.createdAt')}</TableHead>
              <TableHead>{t('organisations.status')}</TableHead>
              <TableHead>
                <span className="sr-only">{t('organisations.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((organisation) => (
              <OrganisationTableRow key={organisation.id} organisation={organisation} />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
