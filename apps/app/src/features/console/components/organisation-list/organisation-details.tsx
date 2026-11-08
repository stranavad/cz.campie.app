import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';

interface OrganisationDetailsProps {
  organisation: ConsoleOrganisation;
  // Bounces and complaints per message, formatted.
  bounceRate: string;
  // Above what mail providers act on.
  mailWarning: boolean;
}

// What the operator checks before approving: the legal identity, the contacts and how its mail fares.
export function OrganisationDetails({ organisation, bounceRate, mailWarning }: OrganisationDetailsProps) {
  const { t } = useTranslation('console');

  return (
    <DescriptionList className="rounded-[20px] bg-muted p-4 lg:grid-cols-3">
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
      <DescriptionItem label={t('fields.mail')}>
        <span className={mailWarning ? 'text-danger-foreground' : undefined}>
          {t('fields.mailValue', {
            sent: organisation.mail.sent,
            bounced: organisation.mail.bounced,
            complained: organisation.mail.complained,
            rate: bounceRate,
          })}
        </span>
      </DescriptionItem>
    </DescriptionList>
  );
}
