import { useTranslation } from 'react-i18next';

import type { Member } from '@repo/schema/admins';

import { Button } from '@/components/ui/button';
import { useMemberRow } from '@/features/members/components/member-list/use-member-row.hook';
import { PermissionsFieldset } from '@/features/members/components/permissions-fieldset/permissions-fieldset';

interface MemberRowProps {
  organisationId: string;
  member: Member;
}

export function MemberRow({ organisationId, member }: MemberRowProps) {
  const { t } = useTranslation('members');
  const row = useMemberRow(organisationId, member);

  return (
    <li className="flex flex-col gap-3 border-b border-border py-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-medium">{member.email}</span>
        {member.owner ? <span className="text-sm text-muted-foreground">{t('members.owner')}</span> : null}
      </div>
      {member.owner ? (
        <p className="text-sm text-muted-foreground">{t('members.ownerHasAll')}</p>
      ) : (
        <div className="max-w-md">
          <PermissionsFieldset value={member.permissions} onChange={row.changePermissions} disabled={row.isBusy} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={row.isBusy} onClick={row.toggleOwner}>
          {member.owner ? t('members.demote') : t('members.promote')}
        </Button>
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
          <Button variant="ghost" size="sm" disabled={row.isBusy} onClick={row.askToRemove}>
            {t('members.remove')}
          </Button>
        )}
      </div>
      {row.failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`members.failure.${row.failure}`)}
        </p>
      )}
    </li>
  );
}
