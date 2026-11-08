import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
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
    <Card className="gap-2">
      <CardTitle className="text-lg">{t('support.title')}</CardTitle>
      {supported.length === 0 ? <p className="text-sm text-muted-foreground">{t('support.none')}</p> : null}
      <ul className="flex flex-col text-sm">
        {supported.map(({ organisation, support }) => (
          <li
            key={organisation.id}
            className="flex flex-wrap items-center gap-3 border-t border-border-subtle py-3 first:border-t-0"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold break-words">{organisation.displayName}</span>
              <span className="text-[13px] text-muted-foreground">
                {t(support.allowWrites ? 'support.writes' : 'support.readOnly', {
                  until: czechDateTime(support.expiresAt),
                })}
              </span>
            </div>
            <Button
              type="button"
              disabled={enter.isPending}
              onClick={() => enter.mutate(organisation.id, { onSuccess: () => void navigate({ to: '/platform' }) })}
            >
              {t('support.enter')}
            </Button>
          </li>
        ))}
      </ul>
      {enter.isError ? <Alert variant="danger">{t('support.failed')}</Alert> : null}
    </Card>
  );
}
