import { useTranslation } from 'react-i18next';

import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';

interface ParticipantSwitchProps {
  // `left`: how many things the child still needs done here.
  participants: readonly { id: string; firstName: string; left: number }[];
  selectedId: string | undefined;
  onSelect: (participantId: string) => void;
}

// Picks which child of the Registration a screen shows, with what is left for each; only shown for more
// than one.
export function ParticipantSwitch({ participants, selectedId, onSelect }: ParticipantSwitchProps) {
  const { t } = useTranslation('portal');

  if (participants.length < 2) {
    return null;
  }

  return (
    <SegmentedControl aria-label={t('participantSwitch')} className="w-full">
      {participants.map((participant) => (
        <SegmentedControlItem
          key={participant.id}
          selected={participant.id === selectedId}
          onClick={() => onSelect(participant.id)}
          className="min-w-0 flex-1 justify-center px-3 text-[15px] sm:h-11"
        >
          <span className="truncate">
            {t('participantLeft', {
              name: participant.firstName,
              left: participant.left === 0 ? t('allDone') : t('left', { count: participant.left }),
            })}
          </span>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
