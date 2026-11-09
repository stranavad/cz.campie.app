import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  fieldSensitivity,
  formFields,
  type Answers,
  type FieldScope,
  type FormDefinition,
} from '@repo/schema/form-engine';
import { pragueDateOf } from '@repo/schema/shared';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';
import { useCreateRegistrationMutation, useTurnusFormQuery } from '@/features/participants/api/participants.queries';

// A Registration taken by phone or on paper: the Turnus's form and its answers, sent once, and a Deposit paid
// in cash recorded with it.
export function useCreateRegistrationPage() {
  const { t } = useTranslation('participants');
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
  const [cashDeposit, setCashDeposit] = useState(false);
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
    // The guardian's or a child's own fields, or the Camp's questions; health data takes Health write, so its
    // fields are left out without it.
    asked: (definition: FormDefinition, scope: FieldScope, part: 'own' | 'questions') =>
      formFields(definition, REGISTRATION_FIELD_CATALOGUE, scope).filter(
        (field) =>
          (field.tier === 'custom') === (part === 'questions') &&
          (membershipAllows(membership, 'health', 'write') || fieldSensitivity(field) !== 'health'),
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
    cashDeposit,
    setCashDeposit,
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
                // A Deposit paid in cash needs one to pay.
                paymentChoice: cashDeposit ? 'deposit' : 'full',
                discountCode: null,
                declarations: declarations.map(({ id }) => ({ id, accepted: ticked.includes(id) })),
                sendConfirmation,
              },
              cashDeposit: cashDeposit ? { paidOn: pragueDateOf(new Date()), note: t('create.cashDepositNote') } : null,
            },
            {
              onSuccess: ({ id }) =>
                void navigate({ to: '/platform/prihlasky/$registrationId', params: { registrationId: id } }),
            },
          ),
  };
}
