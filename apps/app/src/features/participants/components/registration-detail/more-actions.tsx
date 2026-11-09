import { ArrowRightLeftIcon, EllipsisIcon, RefreshCwIcon, Trash2Icon, UserRoundXIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CancelDialog } from '@/features/participants/components/registration-detail/cancel-dialog';
import { EraseDialog } from '@/features/participants/components/registration-detail/erase-dialog';
import { MoveDialog } from '@/features/participants/components/registration-detail/move-dialog';

interface MoreActionsProps {
  organisationId: string;
  detail: RegistrationDetail;
  // Registrations write.
  canWrite: boolean;
  // The Owner's, while there is anything left to erase.
  canErase: boolean;
  // The Camp's other Turnusy to move to.
  others: { id: string; name: string; startDate: string }[];
  onRegenerate: (participantId: string) => void;
}

// The "…" menu of rarer actions: moving, a new Přihláška PDF, cancelling and erasing, each confirmed in a dialog
// where it cannot be undone.
export function MoreActions({ organisationId, detail, canWrite, canErase, others, onRegenerate }: MoreActionsProps) {
  const { t } = useTranslation('participants');
  const [dialog, setDialog] = useState<'move' | 'cancel' | 'erase' | null>(null);
  const close = () => setDialog(null);
  const canMove = canWrite && others.length > 0;

  if (!canWrite && !canErase) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="outline" size="icon" aria-label={t('detail.moreActions')} />}
        >
          <EllipsisIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {canMove ? (
            <DropdownMenuItem onClick={() => setDialog('move')}>
              <ArrowRightLeftIcon aria-hidden="true" />
              {t('edit.move')}
            </DropdownMenuItem>
          ) : null}
          {canWrite
            ? detail.participants.map((participant) => (
                <DropdownMenuItem key={participant.id} onClick={() => onRegenerate(participant.id)}>
                  <RefreshCwIcon aria-hidden="true" />
                  {t('controls.regenerateOf', {
                    name: t('name', { first: participant.firstName, last: participant.lastName }),
                  })}
                </DropdownMenuItem>
              ))
            : null}
          {canWrite ? <DropdownMenuSeparator /> : null}
          {canWrite ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDialog('cancel')}>
              <UserRoundXIcon aria-hidden="true" />
              {t('controls.cancelOpen')}
            </DropdownMenuItem>
          ) : null}
          {canErase ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDialog('erase')}>
              <Trash2Icon aria-hidden="true" />
              {t('erase.open')}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {canMove ? (
        <MoveDialog
          organisationId={organisationId}
          registrationId={detail.id}
          others={others}
          open={dialog === 'move'}
          onClose={close}
        />
      ) : null}
      {canWrite ? (
        <CancelDialog organisationId={organisationId} detail={detail} open={dialog === 'cancel'} onClose={close} />
      ) : null}
      {canErase ? (
        <EraseDialog
          organisationId={organisationId}
          registrationId={detail.id}
          open={dialog === 'erase'}
          onClose={close}
        />
      ) : null}
    </>
  );
}
