import { useTranslation } from 'react-i18next';

import type { ParticipantRow } from '@repo/schema/registrations';

import { Table, TableBody, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ParticipantTableRow } from '@/features/participants/components/participant-list/participant-table-row';

// The whole list on one page, from a tablet up; it scrolls sideways in its own box when narrow.
export function ParticipantTable({ rows }: { rows: ParticipantRow[] }) {
  const { t } = useTranslation('participants');

  return (
    <Table
      containerClassName="hidden md:block"
      className="min-w-[50rem]"
      footer={<TableFooter>{t('count', { count: rows.length })}</TableFooter>}
    >
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.participant')}</TableHead>
          <TableHead>{t('columns.guardian')}</TableHead>
          <TableHead>{t('columns.payment')}</TableHead>
          <TableHead>{t('columns.consents')}</TableHead>
          <TableHead>{t('columns.documents')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <ParticipantTableRow key={row.participantId} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
