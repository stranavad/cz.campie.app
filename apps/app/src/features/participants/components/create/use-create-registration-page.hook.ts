import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  fieldSensitivity,
  formFields,
  pricedFieldIds,
  type Answers,
  type FieldScope,
  type FormDefinition,
} from '@repo/schema/form-engine';
import type { PaymentChoice } from '@repo/schema/pricing';
import { createRegistrationBodySchema, type CreateRegistrationBody } from '@repo/schema/registrations';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';
import {
  useCreateRegistrationMutation,
  useNewRegistrationPriceQuery,
  useTurnusFormQuery,
} from '@/features/participants/api/participants.queries';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

/**
 * Keep only the answers that can change the price.
 * @param answers the answers
 * @param priced the fields that carry a surcharge
 */
function pricedAnswers(answers: Answers, priced: readonly string[]): Answers {
  return Object.fromEntries(Object.entries(answers).filter(([key]) => priced.includes(key)));
}

// A Registration taken by phone or on paper: the Turnus's form and its answers, priced live by the server as
// it would store them, and sent once, a Deposit paid in cash with it.
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
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('full');
  const [codeInput, setCodeInput] = useState('');
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [cashDeposit, setCashDeposit] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const declarations = form.data?.declarations ?? [];

  // The body the create endpoint takes, which its preview prices; the price needs only the answers that
  // carry a surcharge, so typing a name or ticking a declaration asks nothing.
  const bodyOf = (answers: { registration: Answers; participants: Answers[] }, choice: PaymentChoice) =>
    chosen === null
      ? null
      : ({
          idempotencyKey: key,
          turnusId: chosen,
          submission: answers,
          paymentChoice: choice,
          discountCode,
          declarations: [],
          sendConfirmation: true,
          cashDeposit: false,
        } satisfies CreateRegistrationBody);
  const priced = form.data === undefined ? [] : pricedFieldIds(form.data.definition);
  const priceKey = JSON.stringify(
    bodyOf(
      {
        registration: pricedAnswers(registration, priced),
        participants: children.map((child) => pricedAnswers(child, priced)),
      },
      paymentChoice,
    ),
  );
  const settled = useDebouncedValue(priceKey, 400);
  // A body the endpoint would refuse anyway, such as an overlong code, is not priced.
  const priceBody = createRegistrationBodySchema.nullable().safeParse(JSON.parse(settled));
  const price = useNewRegistrationPriceQuery(
    organisationId,
    form.data?.campId,
    priceBody.success ? priceBody.data : null,
  );
  const current = price.isPlaceholderData || settled !== priceKey ? undefined : price.data;
  const depositAvailable = price.data?.depositAvailable === true;
  // A choice the Turnus no longer offers falls back to paying in full, and then no Deposit was paid in cash.
  const choice: PaymentChoice = depositAvailable ? paymentChoice : 'full';
  // The server takes the amount from its own price and refuses a cash Deposit when there is none to pay.
  const canPayCash = choice === 'deposit' && (price.data?.depositTotal ?? 0) > 0;

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
    price: price.data,
    isPriceStale: price.data !== undefined && current === undefined,
    isPriceFailing: price.isError,
    depositAvailable,
    depositFirst: choice === 'deposit',
    setDepositFirst: (on: boolean) => setPaymentChoice(on ? 'deposit' : 'full'),
    codeInput,
    setCodeInput,
    applyCode: () => setDiscountCode(codeInput.trim() === '' ? null : codeInput.trim()),
    // What the typed code does, while it is the one applied.
    codeCheck: discountCode !== null && discountCode === codeInput.trim() ? (current?.discountCode ?? null) : null,
    canPayCash,
    cashDeposit: canPayCash && cashDeposit,
    setCashDeposit,
    isCreating: create.isPending,
    failed: create.isError,
    canSubmit: !create.isPending && chosen !== null && form.data !== undefined,
    submit: () => {
      const body = bodyOf({ registration, participants: children }, choice);

      return form.data === undefined || body === null
        ? undefined
        : create.mutate(
            // The amount paid in cash is the server's Deposit total; only the fact goes along.
            {
              campId: form.data.campId,
              body: {
                ...body,
                declarations: declarations.map(({ id }) => ({ id, accepted: ticked.includes(id) })),
                sendConfirmation,
                cashDeposit: canPayCash && cashDeposit,
              },
            },
            {
              onSuccess: ({ id }) =>
                void navigate({ to: '/platform/prihlasky/$registrationId', params: { registrationId: id } }),
            },
          );
    },
  };
}
