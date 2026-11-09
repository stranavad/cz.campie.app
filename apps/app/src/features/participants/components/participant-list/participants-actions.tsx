import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, buttonVariants } from '@/components/ui/button';
import { TurnusSwitcher } from '@/core/selected-turnus';
import type { ParticipantsPanel } from '@/features/participants/components/participants-search.constant';

interface ParticipantsActionsProps {
  canWrite: boolean;
  hasTurnus: boolean;
  panel: ParticipantsPanel | null;
  onToggle: (panel: ParticipantsPanel) => void;
}

// The list's header actions: the Turnus, the tools that open under the header, and a new Registration.
export function ParticipantsActions({ canWrite, hasTurnus, panel, onToggle }: ParticipantsActionsProps) {
  const { t } = useTranslation('participants');
  const tool = (name: ParticipantsPanel) => ({
    type: 'button' as const,
    variant: 'outline' as const,
    'aria-expanded': panel === name,
    onClick: () => onToggle(name),
  });

  return (
    <>
      <TurnusSwitcher />
      {hasTurnus && canWrite ? <Button {...tool('reminders')}>{t('actions.remind')}</Button> : null}
      {hasTurnus ? <Button {...tool('export')}>{t('actions.export')}</Button> : null}
      {hasTurnus ? <Button {...tool('consents')}>{t('consents.title')}</Button> : null}
      {canWrite ? (
        <Link to="/platform/prihlasky/nova" className={buttonVariants()}>
          <PlusIcon aria-hidden="true" />
          {t('create.open')}
        </Link>
      ) : null}
    </>
  );
}
