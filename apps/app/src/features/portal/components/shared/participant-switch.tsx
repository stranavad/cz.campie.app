import { useTranslation } from 'react-i18next';

import { SegmentedControl, SegmentedControlCount, SegmentedControlItem } from '@/components/ui/segmented-control';

interface ParticipantSwitchProps {
  participants: readonly { id: string; firstName: string; count?: number }[];
  selectedId: string | undefined;
  onSelect: (participantId: string) => void;
}

// Picks which child of the Registration a screen shows; only shown for more than one.
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
          className="flex-1 justify-center px-4 text-[15px] sm:h-11"
        >
          {participant.firstName}
          {participant.count === undefined || participant.count === 0 ? null : (
            <SegmentedControlCount>{participant.count}</SegmentedControlCount>
          )}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
