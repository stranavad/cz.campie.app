import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { OrganisationActions } from '@/features/console/components/organisation-table/organisation-actions';
import { ORGANISATION_STATUS_BADGE } from '@/features/console/components/organisation-table/organisation-status.constant';
import { useOrganisationRow } from '@/features/console/components/organisation-table/use-organisation-row.hook';

interface OrganisationTableRowProps {
  organisation: ConsoleOrganisation;
}

// One Organisation: its name and IČO, its address, when it signed up, its status and what the operator can
// do with it.
export function OrganisationTableRow({ organisation }: OrganisationTableRowProps) {
  const { t } = useTranslation('console');
  const row = useOrganisationRow(organisation);

  return (
    <TableRow>
      <TableCell className="py-3.5">
        <span className="flex flex-col leading-snug">
          <span className="font-semibold break-words">{organisation.displayName}</span>
          <span className="text-[13px] text-muted-foreground">{t('organisations.ico', { ico: organisation.ico })}</span>
        </span>
      </TableCell>
      <TableCell className="break-all text-muted-foreground">
        {t('fields.addressValue', { subdomain: organisation.subdomain })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">{row.signedUpOn}</TableCell>
      <TableCell>
        <Badge variant={ORGANISATION_STATUS_BADGE[organisation.status]}>{t(`status.${organisation.status}`)}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <OrganisationActions organisation={organisation} row={row} />
      </TableCell>
    </TableRow>
  );
}
