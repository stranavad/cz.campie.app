import { useTranslation } from 'react-i18next';

import type { Account } from '@repo/schema/admins';

import { config } from '@/config';

interface OrganisationStatusNoticeProps {
  organisation: Account['memberships'][number]['organisation'];
}

// What the Organisation's status means for the Owner: waiting for the operator, live, or suspended.
export function OrganisationStatusNotice({ organisation }: OrganisationStatusNoticeProps) {
  const { t } = useTranslation('adminHome');
  const { status, displayName } = organisation;

  return (
    <section className="flex max-w-xl flex-col gap-3 py-12">
      <h1 className="text-2xl font-semibold">{t(`${status}.title`)}</h1>
      <p className="text-muted-foreground">{t(`${status}.description`, { name: displayName })}</p>
      {status === 'pending' ? (
        <p className="text-sm text-muted-foreground">
          {t('pending.address', { address: `${organisation.subdomain}.${config.platformDomain}` })}
        </p>
      ) : null}
    </section>
  );
}
