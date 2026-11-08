import { CircleCheckIcon, ClockIcon, OctagonPauseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Account } from '@repo/schema/admins';

import { IconTile } from '@/components/icon-tile';
import { config } from '@/config';
import { cn } from '@/lib/utils';

interface OrganisationStatusNoticeProps {
  organisation: Account['memberships'][number]['organisation'];
}

const LOOKS = {
  pending: { panel: 'bg-warning text-warning-foreground', tone: 'warning', icon: ClockIcon },
  approved: { panel: 'bg-brand-soft text-foreground', tone: 'brand', icon: CircleCheckIcon },
  suspended: { panel: 'bg-danger text-danger-foreground', tone: 'danger', icon: OctagonPauseIcon },
} as const;

// What the Organisation's status means for the Owner: waiting for the operator, live, or suspended.
export function OrganisationStatusNotice({ organisation }: OrganisationStatusNoticeProps) {
  const { t } = useTranslation('adminHome');
  const { status, displayName } = organisation;
  const { panel, tone, icon: Icon } = LOOKS[status];

  return (
    <section className={cn('flex flex-wrap items-start gap-4 rounded-3xl p-5 sm:p-7', panel)}>
      <IconTile tone={tone} className="bg-card">
        <Icon />
      </IconTile>
      <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1">
        <h2 className="text-heading">{t(`${status}.title`)}</h2>
        <p>{t(`${status}.description`, { name: displayName })}</p>
        {status === 'pending' ? (
          <p className="text-sm break-words">
            {t('pending.address', { address: `${organisation.subdomain}.${config.platformDomain}` })}
          </p>
        ) : null}
      </div>
    </section>
  );
}
