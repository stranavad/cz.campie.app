import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Button } from '@/components/ui/button';
import type { OrganisationRowState } from '@/features/console/components/organisation-table/use-organisation-row.hook';

interface OrganisationStatusActionsProps {
  organisation: ConsoleOrganisation;
  row: OrganisationRowState;
}

// Rejecting an Organisation awaiting approval deletes it, suspending an approved one takes it offline: both
// ask once more. A suspended one has nothing here.
export function OrganisationStatusActions({ organisation, row }: OrganisationStatusActionsProps) {
  const { t } = useTranslation('console');
  const action = organisation.status === 'pending' ? 'reject' : organisation.status === 'approved' ? 'suspend' : null;

  if (action === null) {
    return null;
  }

  if (row.confirming === null) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="self-start text-danger-foreground"
        disabled={row.isBusy}
        onClick={() => row.askToConfirm(action)}
      >
        {t(`actions.${action}`)}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="destructive"
        size="sm"
        disabled={row.isBusy}
        onClick={row.confirming === 'reject' ? row.reject : row.suspend}
      >
        {t(`actions.confirm.${row.confirming}`)}
      </Button>
      <Button variant="ghost" size="sm" onClick={row.cancel}>
        {t('actions.cancel')}
      </Button>
    </div>
  );
}
