import { useTranslation } from 'react-i18next';

import type { Member } from '@repo/schema/admins';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MemberSummary } from '@/features/members/components/member-list/member-summary';
import { useMemberRow } from '@/features/members/components/member-list/use-member-row.hook';
import { PermissionsFieldset } from '@/features/members/components/permissions-fieldset/permissions-fieldset';

interface MemberRowProps {
  organisationId: string;
  member: Member;
}

// A member as a native disclosure: the summary line, and once opened their permissions and actions.
export function MemberRow({ organisationId, member }: MemberRowProps) {
  const { t } = useTranslation('members');
  const row = useMemberRow(organisationId, member);

  return (
    <li className="border-t border-border-subtle first:border-t-0">
      <details className="group">
        <MemberSummary member={member} />
        <div className="flex flex-col gap-4 px-5 pt-1 pb-5 sm:px-6 sm:pl-[4.5rem]">
          {member.owner ? (
            <p className="text-sm text-muted-foreground">{t('members.ownerHasAll')}</p>
          ) : (
            <PermissionsFieldset value={member.permissions} onChange={row.changePermissions} disabled={row.isBusy} />
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={row.isBusy} onClick={row.toggleOwner}>
              {member.owner ? t('members.demote') : t('members.promote')}
            </Button>
            {member.totpEnabled && !row.isConfirmingTotpReset ? (
              <Button variant="outline" size="sm" disabled={row.isBusy} onClick={row.askToResetTotp}>
                {t('members.resetTotp')}
              </Button>
            ) : null}
            {member.totpEnabled && row.isConfirmingTotpReset ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-auto min-h-11 py-2 whitespace-normal sm:h-auto sm:min-h-9"
                  disabled={row.isBusy}
                  onClick={row.resetTotp}
                >
                  {t('members.confirmResetTotp')}
                </Button>
                <Button variant="ghost" size="sm" onClick={row.cancelTotpReset}>
                  {t('members.cancel')}
                </Button>
              </>
            ) : null}
            {row.isConfirmingRemoval ? (
              <>
                <Button variant="destructive" size="sm" disabled={row.isBusy} onClick={row.remove}>
                  {t('members.confirmRemove')}
                </Button>
                <Button variant="ghost" size="sm" onClick={row.cancelRemoval}>
                  {t('members.cancel')}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-foreground"
                disabled={row.isBusy}
                onClick={row.askToRemove}
              >
                {t('members.remove')}
              </Button>
            )}
          </div>
          {row.failure === null ? null : (
            <Alert variant="danger" role="alert">
              {t(`members.failure.${row.failure}`)}
            </Alert>
          )}
        </div>
      </details>
    </li>
  );
}
