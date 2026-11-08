import { useState } from 'react';

/**
 * Remember which child a screen shows, the first one until the guardian picks another.
 * @param participants the Registration's children
 */
export function useSelectedParticipant<Participant extends { id: string }>(participants: readonly Participant[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = participants.find(({ id }) => id === selectedId) ?? participants[0];

  return { selected, select: setSelectedId };
}
