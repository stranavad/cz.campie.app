import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useSupportAccessMutations,
  useSupportGrantsQuery,
} from '@/features/organisation-settings/api/organisation-settings.queries';
import { FormMessage } from '@/features/organisation-settings/components/form-message';
import { SupportGrantForm } from '@/features/organisation-settings/components/support-access-section/support-grant-form';
import { SupportGrantHistory } from '@/features/organisation-settings/components/support-access-section/support-grant-history';

// Letting the platform's support into the Organisation for a while, read-only unless changes are allowed,
// with every grant so far.
export function SupportAccessSection({ organisationId }: { organisationId: string }) {
  const { t } = useTranslation('organisationSettings');
  const grants = useSupportGrantsQuery(organisationId);
  const mutations = useSupportAccessMutations(organisationId);
  const active = grants.data?.find((grant) => grant.active);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="font-bold">{t('supportAccess.title')}</h3>
        {active === undefined ? null : (
          <Badge variant="warning" dot>
            {t('supportAccess.activeBadge')}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{t('supportAccess.intro')}</p>
      {active === undefined ? (
        <SupportGrantForm isGranting={mutations.grant.isPending} onGrant={(body) => mutations.grant.mutate(body)} />
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-warning p-3 pl-4 text-warning-foreground">
          <p className="min-w-0 flex-[1_1_14rem] text-sm font-semibold">
            {t(active.allowWrites ? 'supportAccess.activeWrites' : 'supportAccess.activeReadOnly', {
              until: czechDateTime(active.expiresAt),
            })}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-danger-foreground"
            disabled={mutations.revoke.isPending}
            onClick={() => mutations.revoke.mutate(active.id)}
          >
            {t('supportAccess.revoke')}
          </Button>
        </div>
      )}
      <SupportGrantHistory grants={grants.data ?? []} />
      {mutations.grant.isError || mutations.revoke.isError ? (
        <FormMessage tone="danger">{t('failure')}</FormMessage>
      ) : null}
    </div>
  );
}
