import { useTranslation } from 'react-i18next';

import type { Member } from '@repo/schema/admins';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { useMemberEditor } from '@/features/members/components/member-table/use-member-editor.hook';
import { PermissionsFieldset } from '@/features/members/components/permissions-fieldset/permissions-fieldset';

interface MemberEditorProps {
  organisationId: string;
  member: Member;
}

// A member's levels (saved on each change), the Owner role, their two-step login and removal; the last two
// ask once more.
export function MemberEditor({ organisationId, member }: MemberEditorProps) {
  const { t } = useTranslation('members');
  const editor = useMemberEditor(organisationId, member);

  return (
    <div className="flex flex-col gap-5">
      {member.owner ? (
        <p className="text-sm text-muted-foreground">{t('members.ownerHasAll')}</p>
      ) : (
        <PermissionsFieldset value={member.permissions} onChange={editor.changePermissions} disabled={editor.isBusy} />
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={editor.isBusy} onClick={editor.toggleOwner}>
          {member.owner ? t('members.demote') : t('members.promote')}
        </Button>
        {member.totpEnabled && !editor.isConfirmingTotpReset ? (
          <Button variant="outline" size="sm" disabled={editor.isBusy} onClick={editor.askToResetTotp}>
            {t('members.resetTotp')}
          </Button>
        ) : null}
        {member.totpEnabled && editor.isConfirmingTotpReset ? (
          <>
            <Button
              variant="destructive"
              size="sm"
              className="h-auto min-h-11 py-2 whitespace-normal sm:h-auto sm:min-h-9"
              disabled={editor.isBusy}
              onClick={editor.resetTotp}
            >
              {t('members.confirmResetTotp')}
            </Button>
            <Button variant="ghost" size="sm" onClick={editor.cancelTotpReset}>
              {t('members.cancel')}
            </Button>
          </>
        ) : null}
        {editor.isConfirmingRemoval ? (
          <>
            <Button variant="destructive" size="sm" disabled={editor.isBusy} onClick={editor.remove}>
              {t('members.confirmRemove')}
            </Button>
            <Button variant="ghost" size="sm" onClick={editor.cancelRemoval}>
              {t('members.cancel')}
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-foreground"
            disabled={editor.isBusy}
            onClick={editor.askToRemove}
          >
            {t('members.remove')}
          </Button>
        )}
      </div>
      {editor.failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`members.failure.${editor.failure}`)}
        </Alert>
      )}
      <DialogClose render={<Button variant="secondary" className="self-end" />}>{t('members.done')}</DialogClose>
    </div>
  );
}
