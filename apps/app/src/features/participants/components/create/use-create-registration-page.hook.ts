import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { fieldSensitivity, formFields, type Answers, type FormDefinition } from '@repo/schema/form-engine';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';
import { useCreateRegistrationMutation, useTurnusFormQuery } from '@/features/participants/api/participants.queries';

// A Registration taken by phone or on paper: the Turnus's form and its answers, sent once.
export function useCreateRegistrationPage() {
  const navigate = useNavigate();
  const { membership, isLoading, isSignedOut } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const selected = useSelectedTurnus();
  const [turnusId, setTurnusId] = useState<string | null>(null);
  const chosen = turnusId ?? selected.turnusId;
  const form = useTurnusFormQuery(organisationId, chosen);
  const create = useCreateRegistrationMutation(organisationId);
  const [registration, setRegistration] = useState<Answers>({});
  const [children, setChildren] = useState<Answers[]>([{}]);
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [key] = useState(() => crypto.randomUUID());
  const declarations = form.data?.declarations ?? [];

  return {
    isSignedOut,
    isLoading: isLoading || selected.isPending,
    canWrite: membershipAllows(membership, 'registrations', 'write'),
    turnusy: selected.turnusy,
    chosen,
    setTurnusId,
    definition: form.data?.definition,
    isFormLoading: chosen !== null && form.isPending,
    hasNoForm: form.isError,
    // Health data takes Health write, so its fields are left out without it.
    asked: (definition: FormDefinition, scope: 'registration' | 'participant') =>
      formFields(definition, REGISTRATION_FIELD_CATALOGUE, scope).filter(
        (field) => membershipAllows(membership, 'health', 'write') || fieldSensitivity(field) !== 'health',
      ),
    registration,
    setRegistration,
    children,
    setChild: (index: number, answers: Answers) =>
      setChildren(children.map((child, at) => (at === index ? answers : child))),
    canAddChild: children.length < (form.data?.maxParticipants ?? 1),
    addChild: () => setChildren([...children, {}]),
    declarations,
    ticked,
    tick: (id: string, on: boolean) => setTicked(on ? [...ticked, id] : ticked.filter((known) => known !== id)),
    sendConfirmation,
    setSendConfirmation,
    isCreating: create.isPending,
    failed: create.isError,
    canSubmit: !create.isPending && chosen !== null && form.data !== undefined,
    submit: () =>
      form.data === undefined || chosen === null
        ? undefined
        : create.mutate(
            {
              campId: form.data.campId,
              body: {
                idempotencyKey: key,
                turnusId: chosen,
                submission: { registration, participants: children },
                paymentChoice: 'full',
                discountCode: null,
                declarations: declarations.map(({ id }) => ({ id, accepted: ticked.includes(id) })),
                sendConfirmation,
              },
            },
            {
              onSuccess: ({ id }) =>
                void navigate({ to: '/platform/prihlasky/$registrationId', params: { registrationId: id } }),
            },
          ),
  };
}
