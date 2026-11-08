import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { OrganisationActions } from '@/features/console/components/organisation-list/organisation-actions';
import { OrganisationDetails } from '@/features/console/components/organisation-list/organisation-details';
import { ORGANISATION_STATUS_BADGE } from '@/features/console/components/organisation-list/organisation-status.constant';
import { OwnerTotpReset } from '@/features/console/components/organisation-list/owner-totp-reset';
import { SubdomainRename } from '@/features/console/components/organisation-list/subdomain-rename';
import { useOrganisationRow } from '@/features/console/components/organisation-list/use-organisation-row.hook';

interface OrganisationRowProps {
  organisation: ConsoleOrganisation;
}

export function OrganisationRow({ organisation }: OrganisationRowProps) {
  const { t } = useTranslation('console');
  const row = useOrganisationRow(organisation);
  const isPending = organisation.status === 'pending';

  return (
    <li className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-[1_1_14rem] flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg leading-tight font-bold break-words">{organisation.displayName}</span>
            <Badge variant={ORGANISATION_STATUS_BADGE[organisation.status]}>{t(`status.${organisation.status}`)}</Badge>
          </div>
          <span className="text-sm break-all text-muted-foreground">
            {t('fields.addressValue', { subdomain: organisation.subdomain })}
          </span>
        </div>
        <OrganisationActions organisation={organisation} row={row} />
      </div>
      <OrganisationDetails organisation={organisation} bounceRate={row.bounceRate} mailWarning={row.mailWarning} />
      {isPending ? <SubdomainRename organisation={organisation} row={row} /> : null}
      {row.failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`failure.${row.failure}`)}
        </Alert>
      )}
      {isPending ? null : <OwnerTotpReset organisationId={organisation.id} />}
    </li>
  );
}
