import { ArrowRightLeftIcon, EllipsisIcon, RefreshCwIcon, Trash2Icon, UserRoundXIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail, SelectedTurnus } from '@repo/schema/registrations';

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
import { useMoreActions } from '@/features/participants/components/registration-detail/use-more-actions.hook';

interface MoreActionsProps {
  organisationId: string;
  detail: RegistrationDetail;
  // Registrations write.
  canWrite: boolean;
  // The Owner's, while there is anything left to erase.
  canErase: boolean;
  // The Camp's other Turnusy to move to.
  others: SelectedTurnus['turnusy'];
  onRegenerate: (participantId: string) => void;
}

// The "…" menu of rarer actions: moving, a new Přihláška PDF, cancelling and erasing, each confirmed in a dialog
// where it cannot be undone.
export function MoreActions({ organisationId, detail, canWrite, canErase, others, onRegenerate }: MoreActionsProps) {
  const { t } = useTranslation('participants');
  const { openDialog, dialogProps } = useMoreActions();
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
            <DropdownMenuItem onClick={() => openDialog('move')}>
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
            <DropdownMenuItem variant="destructive" onClick={() => openDialog('cancel')}>
              <UserRoundXIcon aria-hidden="true" />
              {t('controls.cancelOpen')}
            </DropdownMenuItem>
          ) : null}
          {canErase ? (
            <DropdownMenuItem variant="destructive" onClick={() => openDialog('erase')}>
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
          {...dialogProps('move')}
        />
      ) : null}
      {canWrite ? <CancelDialog organisationId={organisationId} detail={detail} {...dialogProps('cancel')} /> : null}
      {canErase ? (
        <EraseDialog organisationId={organisationId} registrationId={detail.id} {...dialogProps('erase')} />
      ) : null}
    </>
  );
}
