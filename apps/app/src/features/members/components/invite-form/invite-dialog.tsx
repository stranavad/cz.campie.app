import { UserPlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InviteForm } from '@/features/members/components/invite-form/invite-form';

interface InviteDialogProps {
  organisationId: string;
}

// The page header's "Pozvat člena", opening the invite form; closing it clears the form.
export function InviteDialog({ organisationId }: InviteDialogProps) {
  const { t } = useTranslation('members');

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <UserPlusIcon aria-hidden="true" />
        {t('inviteAction')}
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-1">
          <DialogTitle>{t('invite.title')}</DialogTitle>
          <DialogDescription>{t('invite.intro')}</DialogDescription>
        </div>
        <InviteForm organisationId={organisationId} />
      </DialogContent>
    </Dialog>
  );
}
