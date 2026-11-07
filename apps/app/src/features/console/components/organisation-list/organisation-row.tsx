import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OwnerTotpReset } from '@/features/console/components/organisation-list/owner-totp-reset';
import { useOrganisationRow } from '@/features/console/components/organisation-list/use-organisation-row.hook';

interface OrganisationRowProps {
  organisation: ConsoleOrganisation;
}

export function OrganisationRow({ organisation }: OrganisationRowProps) {
  const { t } = useTranslation('console');
  const row = useOrganisationRow(organisation);
  const isPending = organisation.status === 'pending';

  return (
    <li className="flex flex-col gap-3 border-b border-border py-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-medium">{organisation.displayName}</span>
        <span className="text-sm text-muted-foreground">{t(`status.${organisation.status}`)}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t('fields.address')}</dt>
        <dd>{t('fields.addressValue', { subdomain: organisation.subdomain })}</dd>
        <dt className="text-muted-foreground">{t('fields.legalName')}</dt>
        <dd>{organisation.legalName}</dd>
        <dt className="text-muted-foreground">{t('fields.ico')}</dt>
        <dd>
          {organisation.vatId === null
            ? organisation.ico
            : t('fields.icoWithVat', { ico: organisation.ico, vatId: organisation.vatId })}
        </dd>
        <dt className="text-muted-foreground">{t('fields.seat')}</dt>
        <dd>{organisation.address}</dd>
        <dt className="text-muted-foreground">{t('fields.statutoryRepresentative')}</dt>
        <dd>{organisation.statutoryRepresentative}</dd>
        <dt className="text-muted-foreground">{t('fields.contact')}</dt>
        <dd>{t('fields.contactValue', { email: organisation.contactEmail, phone: organisation.contactPhone })}</dd>
        <dt className="text-muted-foreground">{t('fields.mail')}</dt>
        <dd className={row.mailWarning ? 'text-destructive' : undefined}>
          {t('fields.mailValue', {
            sent: organisation.mail.sent,
            bounced: organisation.mail.bounced,
            complained: organisation.mail.complained,
            rate: row.bounceRate,
          })}
        </dd>
      </dl>
      {isPending ? (
        <form
          className="flex max-w-md items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            row.rename();
          }}
        >
          <Input
            aria-label={t('rename.label')}
            value={row.subdomain}
            onChange={(event) => row.setSubdomain(event.target.value)}
            disabled={row.isBusy}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={row.isBusy || row.subdomain === organisation.subdomain}
          >
            {t('rename.submit')}
          </Button>
        </form>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {isPending ? (
          <Button size="sm" disabled={row.isBusy} onClick={row.approve}>
            {t('actions.approve')}
          </Button>
        ) : null}
        {row.confirming === null ? (
          <>
            {isPending ? (
              <Button variant="ghost" size="sm" disabled={row.isBusy} onClick={() => row.askToConfirm('reject')}>
                {t('actions.reject')}
              </Button>
            ) : null}
            {organisation.status === 'approved' ? (
              <Button variant="ghost" size="sm" disabled={row.isBusy} onClick={() => row.askToConfirm('suspend')}>
                {t('actions.suspend')}
              </Button>
            ) : null}
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      {row.failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`failure.${row.failure}`)}
        </p>
      )}
      {isPending ? null : <OwnerTotpReset organisationId={organisation.id} />}
    </li>
  );
}
