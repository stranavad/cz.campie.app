import { useTranslation } from 'react-i18next';

import type { Member } from '@repo/schema/admins';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MemberEditor } from '@/features/members/components/member-table/member-editor';

interface MemberEditDialogProps {
  organisationId: string;
  member: Member;
}

// The row's "Upravit": the member's levels, Owner role, two-step login and removal in a dialog.
export function MemberEditDialog({ organisationId, member }: MemberEditDialogProps) {
  const { t } = useTranslation('members');

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
        aria-label={t('members.editMember', { email: member.email })}
      >
        {t('members.edit')}
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-1">
          <DialogTitle>{t('members.editTitle')}</DialogTitle>
          <DialogDescription className="break-all">{member.email}</DialogDescription>
        </div>
        <MemberEditor organisationId={organisationId} member={member} />
      </DialogContent>
    </Dialog>
  );
}
