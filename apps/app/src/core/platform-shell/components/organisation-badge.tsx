import { TentIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { config } from '@/config';
import { useCurrentMembership } from '@/core/account';
import { cn } from '@/lib/utils';

interface OrganisationBadgeProps {
  // One line, for the phone's top bar.
  compact?: boolean;
}

// The Organisation the admin works in, in its accent, with their role; the product's name without one.
export function OrganisationBadge({ compact = false }: OrganisationBadgeProps) {
  const { t } = useTranslation();
  const { membership } = useCurrentMembership();
  const name = membership?.organisation.displayName ?? config.productName;
  const role =
    membership === undefined
      ? null
      : membership.support !== null
        ? t('platformShell.role.support')
        : membership.owner
          ? t('platformShell.role.owner')
          : t('platformShell.role.member');

  return (
    <div className="flex min-w-0 items-center gap-3 px-1">
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground',
          compact ? 'size-8' : 'size-10.5',
        )}
      >
        <TentIcon className={compact ? 'size-4' : 'size-5'} />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-display text-[17px] font-bold tracking-[-0.01em]">{name}</span>
        {role === null || compact ? null : <span className="truncate text-xs text-muted-foreground">{role}</span>}
      </span>
    </div>
  );
}
