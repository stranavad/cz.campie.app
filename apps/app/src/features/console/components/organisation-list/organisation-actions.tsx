import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Button, buttonVariants } from '@/components/ui/button';
import type { OrganisationRowState } from '@/features/console/components/organisation-list/use-organisation-row.hook';

interface OrganisationActionsProps {
  organisation: ConsoleOrganisation;
  row: OrganisationRowState;
}

// Preview, approve or reject an Organisation awaiting approval; suspend an approved one. Rejecting and
// suspending ask once more.
export function OrganisationActions({ organisation, row }: OrganisationActionsProps) {
  const { t } = useTranslation('console');
  const isPending = organisation.status === 'pending';
  const isConfirming = row.confirming !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPending ? (
        <Link
          to="/platform/konzole/nahled"
          search={{ organizace: organisation.id }}
          className={buttonVariants({ variant: 'ghost' })}
        >
          {t('actions.preview')}
        </Link>
      ) : null}
      {isPending ? (
        <Button disabled={row.isBusy} onClick={row.approve}>
          {t('actions.approve')}
        </Button>
      ) : null}
      {isPending && !isConfirming ? (
        <Button
          variant="outline"
          className="text-danger-foreground"
          disabled={row.isBusy}
          onClick={() => row.askToConfirm('reject')}
        >
          {t('actions.reject')}
        </Button>
      ) : null}
      {organisation.status === 'approved' && !isConfirming ? (
        <Button variant="outline" disabled={row.isBusy} onClick={() => row.askToConfirm('suspend')}>
          {t('actions.suspend')}
        </Button>
      ) : null}
      {row.confirming === null ? null : (
        <>
          <Button
            variant="destructive"
            disabled={row.isBusy}
            onClick={row.confirming === 'reject' ? row.reject : row.suspend}
          >
            {t(`actions.confirm.${row.confirming}`)}
          </Button>
          <Button variant="ghost" onClick={row.cancel}>
            {t('actions.cancel')}
          </Button>
        </>
      )}
    </div>
  );
}
