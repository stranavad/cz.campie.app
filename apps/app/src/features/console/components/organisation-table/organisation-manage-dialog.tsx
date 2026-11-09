import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrganisationDetails } from '@/features/console/components/organisation-table/organisation-details';
import { OrganisationStatusActions } from '@/features/console/components/organisation-table/organisation-status-actions';
import { ORGANISATION_STATUS_BADGE } from '@/features/console/components/organisation-table/organisation-status.constant';
import { OwnerTotpReset } from '@/features/console/components/organisation-table/owner-totp-reset';
import { SubdomainRename } from '@/features/console/components/organisation-table/subdomain-rename';
import type { OrganisationRowState } from '@/features/console/components/organisation-table/use-organisation-row.hook';

interface OrganisationManageDialogProps {
  organisation: ConsoleOrganisation;
  row: OrganisationRowState;
}

// What the operator checks and changes on one Organisation: its identity and mail, the subdomain while it
// awaits approval, rejecting or suspending it, and an Owner's two-step reset once it is approved.
export function OrganisationManageDialog({ organisation, row }: OrganisationManageDialogProps) {
  const { t } = useTranslation('console');
  const isPending = organisation.status === 'pending';

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          row.cancel();
        }
      }}
    >
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
        aria-label={t('actions.manageOrganisation', { organisation: organisation.displayName })}
      >
        {t('actions.manage')}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <DialogTitle className="break-words">{organisation.displayName}</DialogTitle>
          <Badge variant={ORGANISATION_STATUS_BADGE[organisation.status]}>{t(`status.${organisation.status}`)}</Badge>
        </div>
        <OrganisationDetails organisation={organisation} bounceRate={row.bounceRate} mailWarning={row.mailWarning} />
        {isPending ? <SubdomainRename organisation={organisation} row={row} /> : null}
        <OrganisationStatusActions organisation={organisation} row={row} />
        {row.failure === null ? null : (
          <p role="alert" className="text-sm text-danger-foreground">
            {t(`failure.${row.failure}`)}
          </p>
        )}
        {isPending ? null : <OwnerTotpReset organisationId={organisation.id} />}
      </DialogContent>
    </Dialog>
  );
}
