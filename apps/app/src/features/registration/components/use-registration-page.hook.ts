import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ageProblem, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  checkSubmission,
  FORM_ANSWER_ERROR_CODES,
  formFields,
  type Answers,
  type AnswerValue,
} from '@repo/schema/form-engine';
import { SUBMISSION_FIELD_ERROR_CODES } from '@repo/schema/registrations';

import {
  useRegistrationCampQuery,
  useRegistrationFormQuery,
  useRegistrationTurnusyQuery,
  useStartCardPaymentMutation,
  useSubmitRegistrationMutation,
} from '@/features/registration/api/registration.queries';
import { REGISTRATION_STEPS } from '@/features/registration/components/registration-step.constant';
import { firstChildOf, stepOfPath } from '@/features/registration/components/registration-step.helper';
import {
  askedAnswers,
  focusFirstProblem,
  focusStepHeading,
  refusalKeyOf,
  refusalOf,
  samePath,
} from '@/features/registration/components/submission.helper';
import { useLivePrice } from '@/features/registration/components/use-live-price.hook';
import { HttpError } from '@/lib/api';

// The public form as the guardian fills it in, step by step: the guardians (and the Turnus when the link
// carries none), the children, the Registration's own questions, then a summary with the payment and the
// declarations. Each step is checked before the next opens; the live price follows every step.
export function useRegistrationPage(slug: string, turnusId: string | undefined, requestedStep: number) {
  const { t } = useTranslation('registration');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const camp = useRegistrationCampQuery(slug);
  const form = useRegistrationFormQuery(slug);
  const turnusy = useRegistrationTurnusyQuery(slug);
  const [participants, setParticipants] = useState<Answers[]>([{}]);
  const [registration, setRegistration] = useState<Answers>({});
  const [ticked, setTicked] = useState<readonly string[]>([]);
  // The furthest step the guardian got to by checked steps: an address naming a later one (a reload, which
  // empties the form) shows this one instead.
  const [reached, setReached] = useState(1);
  // The errors of the steps up to this one are shown: those the guardian asked to leave.
  const [checkedUpTo, setCheckedUpTo] = useState(0);
  const [activeChild, setActiveChild] = useState(0);
  const [hasSecondGuardian, setSecondGuardian] = useState(false);
  // A link to the form without a Turnus asks for one on the first step; one with it names it in the header.
  const [asksTurnus] = useState(turnusId === undefined);
  // The key of the last sent form: sending the same form again, as after a lost response, reuses it, so
  // one Registration comes of it; a changed form gets a new one.
  const [lastSent, setLastSent] = useState<{ key: string; content: string } | null>(null);
  const sending = useSubmitRegistrationMutation(slug);
  const [byCard, setByCard] = useState(false);
  const card = useStartCardPaymentMutation();
  const cardOffered = camp.data?.cardPayments === true;
  // A change of the answers makes the server's last refusal stale.
  const edited = () => {
    if (sending.isError) {
      sending.reset();
    }
  };
  const refusal = refusalOf(sending.error);

  const step = Math.min(requestedStep, reached);
  const definition = form.data?.definition;
  const turnus = turnusy.data?.find(({ id }) => id === turnusId);
  const participantFields =
    definition === undefined ? [] : formFields(definition, REGISTRATION_FIELD_CATALOGUE, 'participant');
  const registrationFields =
    definition === undefined ? [] : formFields(definition, REGISTRATION_FIELD_CATALOGUE, 'registration');
  const submission = {
    registration: askedAnswers(registration, registrationFields),
    participants: participants.map((answers) => askedAnswers(answers, participantFields)),
  };
  const price = useLivePrice(slug, definition, turnus, submission);
  const localErrors =
    definition === undefined ? [] : checkSubmission(definition, REGISTRATION_FIELD_CATALOGUE, submission).errors;
  const errors = localErrors.filter(({ path }) => stepOfPath(path) <= checkedUpTo);
  const ageProblemOf = (answers: Answers) => {
    const birthDate = answers.birthDate;

    return turnus === undefined || typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)
      ? null
      : ageProblem(birthDate, turnus);
  };
  const missingDeclarations = (form.data?.declarations ?? []).filter(
    ({ id, mandatory }) => mandatory && !ticked.includes(id),
  );
  const outOfAge = submission.participants.findIndex((answers) => ageProblemOf(answers) !== null);
  // The steps something is wrong at, by what this form can tell; the server checks it all again.
  const problemSteps = [
    ...(turnus === undefined ? [1] : []),
    ...localErrors.map(({ path }) => stepOfPath(path)),
    ...(outOfAge === -1 ? [] : [2]),
    ...(missingDeclarations.length === 0 ? [] : [4]),
  ];
  const childToShow = (paths: readonly (readonly (string | number)[])[]) =>
    firstChildOf(paths) ?? (outOfAge === -1 ? null : outOfAge);
  const goTo = (next: number) =>
    navigate({
      to: '/organisation/$campSlug/prihlaska',
      params: { campSlug: slug },
      search: (previous) => ({ ...previous, krok: next === 1 ? undefined : next }),
    });
  // Shows the first step a list of problems names, and the first problem on it.
  const showProblems = (steps: readonly number[], paths: readonly (readonly (string | number)[])[]) => {
    const first = Math.min(...steps);
    const child = childToShow(paths);

    if (first === 2 && child !== null) {
      setActiveChild(child);
    }

    if (first < step) {
      void goTo(first).then(focusFirstProblem);
    } else {
      focusFirstProblem();
    }
  };

  return {
    isLoading: camp.isPending || form.isPending || turnusy.isPending,
    hasNoForm: form.error instanceof HttpError && form.error.status === 404,
    isError: camp.isError || turnusy.isError || (form.isError && !(form.error instanceof HttpError)),
    camp: camp.data,
    form: form.data,
    step,
    stepCount: REGISTRATION_STEPS.length,
    // Back to an earlier step from the summary, at the child to change.
    edit: (target: number, child?: number) => {
      if (child !== undefined) {
        setActiveChild(child);
      }

      void goTo(target).then(focusStepHeading);
    },
    turnusy: turnusy.data ?? [],
    turnus,
    asksTurnus: asksTurnus || turnus === undefined,
    isTurnusMissing: checkedUpTo >= 1 && turnus === undefined,
    selectTurnus: (id: string) => {
      edited();
      void navigate({
        to: '/organisation/$campSlug/prihlaska',
        params: { campSlug: slug },
        search: (previous) => ({ ...previous, turnus: id === '' ? undefined : id }),
        replace: true,
      });
    },
    participantFields,
    registrationFields,
    participants,
    activeChild: Math.min(activeChild, participants.length - 1),
    setActiveChild,
    // The children with something wrong shown, marked on their chips.
    invalidChildren: participants.flatMap((answers, index) =>
      [...errors, ...refusal.fields].some(({ path }) => path[0] === 'participants' && path[1] === index) ||
      (checkedUpTo >= 2 && ageProblemOf(answers) !== null)
        ? [index]
        : [],
    ),
    setParticipantAnswer: (index: number, key: string, value: AnswerValue) => {
      edited();
      setParticipants(participants.map((answers, at) => (at === index ? { ...answers, [key]: value } : answers)));
    },
    addParticipant: () => {
      edited();
      setParticipants([...participants, {}]);
      setActiveChild(participants.length);
    },
    removeParticipant: (index: number) => {
      edited();
      setParticipants(participants.filter((_, at) => at !== index));
      setActiveChild(Math.max(0, index - 1));
    },
    canAddParticipant: participants.length < (form.data?.maxParticipants ?? 1),
    registration,
    setRegistrationAnswer: (key: string, value: AnswerValue) => {
      edited();
      setRegistration({ ...registration, [key]: value });
    },
    hasSecondGuardian,
    setSecondGuardian,
    ...price,
    setCodeInput: (code: string) => {
      edited();
      price.setCodeInput(code);
    },
    ticked,
    tick: (id: string, checked: boolean) => {
      edited();
      setTicked(checked ? [...ticked, id] : ticked.filter((tickedId) => tickedId !== id));
    },
    // The form's own check first; then what the server refused, such as a child it found too young.
    messageAt: (path: readonly (string | number)[]) => {
      const error = errors.find((candidate) => samePath(candidate.path, path));
      const refused = refusal.fields.find((candidate) => samePath(candidate.path, path));

      if (error !== undefined) {
        return tCommon(`form.errors.${error.code}`, { ...error.params });
      }

      if (refused === undefined) {
        return null;
      }

      const formCode = FORM_ANSWER_ERROR_CODES.find((known) => known === refused.code);
      const submissionCode = SUBMISSION_FIELD_ERROR_CODES.find((known) => known === refused.code);

      if (formCode !== undefined) {
        return tCommon(`form.errors.${formCode}`, { ...refused.params });
      }

      return submissionCode === undefined
        ? tCommon('form.errors.form_answer_invalid')
        : t(`refused.${submissionCode}`, { ...refused.params, contact: camp.data?.contactEmail ?? '' });
    },
    ageNote: (answers: Answers) => {
      const problem = ageProblemOf(answers);

      return problem === null
        ? null
        : t(`age.${problem}`, { min: turnus?.minAge, max: turnus?.maxAge, contact: camp.data?.contactEmail ?? '' });
    },
    missingDeclarations: checkedUpTo >= 4 ? missingDeclarations : [],
    // Why the server refused the whole submission, when no field explains it.
    refusalMessage:
      refusal.code === null || refusal.fields.length > 0 ? null : t(`refused.${refusalKeyOf(refusal.code)}`),
    hasFieldRefusal: refusal.fields.length > 0,
    isSending: sending.isPending,
    submitted: sending.data,
    cardOffered,
    byCard: cardOffered && byCard,
    setByCard,
    // Once the Registration is in, a card payment is on its way to Comgate, or failed and leaves bank transfer.
    cardStatus: card.isError ? ('failed' as const) : card.isIdle ? null : ('redirecting' as const),
    // Opens the next step once this one checks out; else shows what is wrong on it.
    next: () => {
      setCheckedUpTo(Math.max(checkedUpTo, step));

      if (problemSteps.includes(step)) {
        showProblems(
          [step],
          localErrors.map(({ path }) => path),
        );

        return;
      }

      setReached(Math.max(reached, step + 1));
      void goTo(step + 1).then(focusStepHeading);
    },
    // Sends the form once it checks out here, else shows the first step with something wrong; the server
    // checks it all again, and its refusals are shown where they belong.
    send: () => {
      setCheckedUpTo(REGISTRATION_STEPS.length);

      if (problemSteps.length > 0) {
        showProblems(
          problemSteps,
          localErrors.map(({ path }) => path),
        );

        return;
      }

      if (turnus === undefined || sending.isPending) {
        return;
      }

      const body = {
        turnusId: turnus.id,
        submission,
        paymentChoice: price.paymentChoice,
        discountCode: price.discountCode,
        declarations: (form.data?.declarations ?? []).map(({ id }) => ({ id, accepted: ticked.includes(id) })),
      };
      const content = JSON.stringify(body);
      const key = lastSent?.content === content ? lastSent.key : crypto.randomUUID();

      setLastSent({ key, content });
      sending.mutate(
        { ...body, idempotencyKey: key },
        {
          onSuccess: () => (cardOffered && byCard ? card.mutate(key) : undefined),
          onError: (error) => {
            const paths = refusalOf(error).fields.map(({ path }) => path);

            showProblems(paths.length === 0 ? [step] : paths.map(stepOfPath), paths);
          },
        },
      );
    },
  };
}

export type RegistrationPageState = ReturnType<typeof useRegistrationPage>;
