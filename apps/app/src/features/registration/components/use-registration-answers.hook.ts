import { useState } from 'react';

import type { Answers, AnswerValue } from '@repo/schema/form-engine';

/**
 * What the guardian has filled in so far: the Registration's answers, each child's, the declarations ticked.
 * @param maxParticipants how many children one Registration may take
 * @param onEdit called on every change of an answer
 */
export function useRegistrationAnswers(maxParticipants: number, onEdit: () => void) {
  const [participants, setParticipants] = useState<Answers[]>([{}]);
  const [registration, setRegistration] = useState<Answers>({});
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [activeChild, setActiveChild] = useState(0);
  const [hasSecondGuardian, setSecondGuardian] = useState(false);

  return {
    participants,
    activeChild: Math.min(activeChild, participants.length - 1),
    setActiveChild,
    setParticipantAnswer: (index: number, key: string, value: AnswerValue) => {
      onEdit();
      setParticipants(participants.map((answers, at) => (at === index ? { ...answers, [key]: value } : answers)));
    },
    addParticipant: () => {
      onEdit();
      setParticipants([...participants, {}]);
      setActiveChild(participants.length);
    },
    removeParticipant: (index: number) => {
      onEdit();
      setParticipants(participants.filter((_, at) => at !== index));
      setActiveChild(Math.max(0, index - 1));
    },
    canAddParticipant: participants.length < maxParticipants,
    registration,
    setRegistrationAnswer: (key: string, value: AnswerValue) => {
      onEdit();
      setRegistration({ ...registration, [key]: value });
    },
    hasSecondGuardian,
    setSecondGuardian,
    ticked,
    tick: (id: string, checked: boolean) => {
      onEdit();
      setTicked(checked ? [...ticked, id] : ticked.filter((tickedId) => tickedId !== id));
    },
  };
}
