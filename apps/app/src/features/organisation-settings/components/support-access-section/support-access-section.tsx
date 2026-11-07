import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import {
  useSupportAccessMutations,
  useSupportGrantsQuery,
} from '@/features/organisation-settings/api/organisation-settings.queries';

const DURATIONS = [2, 24, 72, 168] as const;

// Letting the platform's support into the Organisation for a while, read-only unless changes are allowed,
// with every grant so far.
export function SupportAccessSection({ organisationId }: { organisationId: string }) {
  const { t } = useTranslation('organisationSettings');
  const grants = useSupportGrantsQuery(organisationId);
  const mutations = useSupportAccessMutations(organisationId);
  const [hours, setHours] = useState<number>(24);
  const [allowWrites, setAllowWrites] = useState(false);
  const active = grants.data?.find((grant) => grant.active);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('supportAccess.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('supportAccess.intro')}</p>
      {active === undefined ? (
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1">
            {t('supportAccess.duration')}
            <select
              className="h-9 rounded-lg border border-input bg-transparent px-2"
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
            >
              {DURATIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {t('supportAccess.hours', { count: duration })}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowWrites} onChange={(event) => setAllowWrites(event.target.checked)} />
            {t('supportAccess.allowWrites')}
          </label>
          <Button
            type="button"
            size="sm"
            disabled={mutations.grant.isPending}
            onClick={() => mutations.grant.mutate({ hours, allowWrites })}
          >
            {t('supportAccess.grant')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">
            {t(active.allowWrites ? 'supportAccess.activeWrites' : 'supportAccess.activeReadOnly', {
              until: czechDateTime(active.expiresAt),
            })}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={mutations.revoke.isPending}
            onClick={() => mutations.revoke.mutate(active.id)}
          >
            {t('supportAccess.revoke')}
          </Button>
        </div>
      )}
      {(grants.data ?? []).length === 0 ? null : (
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {(grants.data ?? []).map((grant) => (
            <li key={grant.id}>
              {t('supportAccess.history', {
                from: czechDateTime(grant.grantedAt),
                until: czechDateTime(grant.revokedAt ?? grant.expiresAt),
                kind: t(grant.allowWrites ? 'supportAccess.kindWrites' : 'supportAccess.kindReadOnly'),
              })}
            </li>
          ))}
        </ul>
      )}
      {mutations.grant.isError || mutations.revoke.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
    </section>
  );
}
