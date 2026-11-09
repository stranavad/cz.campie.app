import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';
import type { OrganisationRowState } from '@/features/console/components/organisation-table/use-organisation-row.hook';

interface OrganisationDetailsProps {
  organisation: ConsoleOrganisation;
  // Its mail with the rates of bounces and complaints, and whether it is above what mail providers act on.
  mail: OrganisationRowState['mail'];
}

// What the operator checks before approving: the legal identity, the contacts and how its mail fares.
export function OrganisationDetails({ organisation, mail }: OrganisationDetailsProps) {
  const { t } = useTranslation('console');

  return (
    <DescriptionList className="rounded-[20px] bg-muted p-4">
      <DescriptionItem label={t('fields.legalName')}>{organisation.legalName}</DescriptionItem>
      <DescriptionItem label={t('fields.ico')}>
        {organisation.vatId === null
          ? organisation.ico
          : t('fields.icoWithVat', { ico: organisation.ico, vatId: organisation.vatId })}
      </DescriptionItem>
      <DescriptionItem label={t('fields.seat')}>{organisation.address}</DescriptionItem>
      <DescriptionItem label={t('fields.statutoryRepresentative')}>
        {organisation.statutoryRepresentative}
      </DescriptionItem>
      <DescriptionItem label={t('fields.contact')}>
        {t('fields.contactValue', { email: organisation.contactEmail, phone: organisation.contactPhone })}
      </DescriptionItem>
      <DescriptionItem label={t('fields.mailLastSevenDays')}>
        <span className={mail.warning ? 'text-danger-foreground' : undefined}>
          {t('fields.mailValue', mail.lastSevenDays)}
        </span>
      </DescriptionItem>
      <DescriptionItem label={t('fields.mailTotal')}>{t('fields.mailValue', mail.total)}</DescriptionItem>
    </DescriptionList>
  );
}
