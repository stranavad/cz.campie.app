import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Button, buttonVariants } from '@/components/ui/button';
import { OrganisationManageDialog } from '@/features/console/components/organisation-table/organisation-manage-dialog';
import type { OrganisationRowState } from '@/features/console/components/organisation-table/use-organisation-row.hook';

interface OrganisationActionsProps {
  organisation: ConsoleOrganisation;
  row: OrganisationRowState;
}

// A row's actions: preview and approve an Organisation awaiting approval; the rest (its details, the
// subdomain, rejecting, suspending, an Owner's two-step reset) behind "Spravovat".
export function OrganisationActions({ organisation, row }: OrganisationActionsProps) {
  const { t } = useTranslation('console');
  const isPending = organisation.status === 'pending';

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {isPending ? (
          <Link
            to="/platform/konzole/nahled"
            search={{ organizace: organisation.id }}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            {t('actions.preview')}
          </Link>
        ) : null}
        {isPending ? (
          <Button size="sm" disabled={row.isBusy} onClick={row.approve}>
            {t('actions.approve')}
          </Button>
        ) : null}
        <OrganisationManageDialog organisation={organisation} row={row} />
      </div>
      {row.failure === null ? null : (
        <p role="alert" className="max-w-xs text-[13px] whitespace-normal text-danger-foreground">
          {t(`failure.${row.failure}`)}
        </p>
      )}
    </div>
  );
}
