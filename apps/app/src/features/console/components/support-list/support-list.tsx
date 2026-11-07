import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { useAccountQuery } from '@/core/account';
import { useEnterSupportMutation } from '@/features/console/api/console.queries';

// The Organisations whose Owners granted support access now, to enter from the console.
export function SupportList() {
  const { t } = useTranslation('console');
  const account = useAccountQuery();
  const enter = useEnterSupportMutation();
  const navigate = useNavigate();
  const supported = (account.data?.memberships ?? []).flatMap(({ organisation, support }) =>
    support === null ? [] : [{ organisation, support }],
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('support.title')}</h2>
      {supported.length === 0 ? <p className="text-sm text-muted-foreground">{t('support.none')}</p> : null}
      <ul className="flex flex-col divide-y rounded-lg border text-sm">
        {supported.map(({ organisation, support }) => (
          <li key={organisation.id} className="flex flex-wrap items-center gap-3 p-3">
            <span className="font-medium">{organisation.displayName}</span>
            <span className="text-muted-foreground">
              {t(support.allowWrites ? 'support.writes' : 'support.readOnly', {
                until: czechDateTime(support.expiresAt),
              })}
            </span>
            <Button
              type="button"
              size="sm"
              disabled={enter.isPending}
              onClick={() => enter.mutate(organisation.id, { onSuccess: () => void navigate({ to: '/platform' }) })}
            >
              {t('support.enter')}
            </Button>
          </li>
        ))}
      </ul>
      {enter.isError ? <p className="text-sm text-destructive">{t('support.failed')}</p> : null}
    </section>
  );
}
