// A Participant's place: Registered holds one, Cancelled released it.
export const PARTICIPANT_STATUSES = ['registered', 'cancelled'] as const;

export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];
