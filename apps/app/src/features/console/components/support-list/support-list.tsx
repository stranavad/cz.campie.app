import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useAccountQuery, useLeaveSupportMutation } from '@/core/account';
import { useEnterSupportMutation } from '@/features/console/api/console.queries';

// The Organisations whose Owners granted support access now, to enter from the console; the operator is in
// at most one of them, and entering another leaves it first.
export function SupportList() {
  const { t } = useTranslation('console');
  const account = useAccountQuery();
  const enter = useEnterSupportMutation();
  const leave = useLeaveSupportMutation();
  const navigate = useNavigate();
  const supported = (account.data?.memberships ?? []).flatMap(({ organisation, support }) =>
    support === null ? [] : [{ organisation, support }],
  );
  const current = supported.find(({ support }) => support.entered)?.organisation.id;
  const isPending = enter.isPending || leave.isPending;

  const enterAndOpen = (organisationId: string) =>
    enter.mutate(organisationId, { onSuccess: () => void navigate({ to: '/platform' }) });
  const switchTo = (organisationId: string) =>
    current === undefined
      ? enterAndOpen(organisationId)
      : leave.mutate(current, { onSuccess: () => enterAndOpen(organisationId) });

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
              <span className="flex flex-wrap items-center gap-2 font-semibold break-words">
                {organisation.displayName}
                {support.entered ? <Badge>{t('support.current')}</Badge> : null}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {t(support.allowWrites ? 'support.writes' : 'support.readOnly', {
                  until: czechDateTime(support.expiresAt),
                })}
              </span>
            </div>
            {support.entered ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => leave.mutate(organisation.id)}
              >
                {t('support.leave')}
              </Button>
            ) : (
              <Button type="button" disabled={isPending} onClick={() => switchTo(organisation.id)}>
                {t('support.enter')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {enter.isError ? <Alert variant="danger">{t('support.failed')}</Alert> : null}
      {leave.isError ? <Alert variant="danger">{t('support.leaveFailed')}</Alert> : null}
    </Card>
  );
}
