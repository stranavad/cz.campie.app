import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { personNameWithEmail } from '@/core/account';
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
  const grantedBy = active?.grantedBy ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex min-w-0 flex-[1_1_16rem] flex-col leading-snug">
          <span className="font-semibold">{t('supportAccess.title')}</span>
          <span className="text-[13px] text-muted-foreground">
            {active === undefined
              ? t('supportAccess.intro')
              : t(active.allowWrites ? 'supportAccess.activeWrites' : 'supportAccess.activeReadOnly', {
                  until: czechDateTime(active.expiresAt),
                })}
          </span>
          {grantedBy === null ? null : (
            <span className="text-[13px] break-words text-muted-foreground">
              {t('supportAccess.grantedBy', { name: personNameWithEmail(grantedBy) })}
            </span>
          )}
        </span>
        {active === undefined ? null : (
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
        )}
      </div>
      {active === undefined ? (
        <SupportGrantForm isGranting={mutations.grant.isPending} onGrant={(body) => mutations.grant.mutate(body)} />
      ) : null}
      <SupportGrantHistory grants={grants.data ?? []} />
      {mutations.grant.isError || mutations.revoke.isError ? (
        <FormMessage tone="danger">{t('failure')}</FormMessage>
      ) : null}
    </div>
  );
}
