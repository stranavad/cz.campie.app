import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ageProblem, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { checkSubmission, formFields, type Answers } from '@repo/schema/form-engine';

import {
  useRegistrationCampQuery,
  useRegistrationFormQuery,
  useRegistrationTurnusyQuery,
} from '@/features/registration/api/registration.queries';
import {
  REGISTRATION_STEPS,
  type RegistrationStep,
} from '@/features/registration/components/registration-step.constant';
import { firstChildOf, stepNumberOf, stepOfPath } from '@/features/registration/components/registration-step.helper';
import { askedAnswers, samePath } from '@/features/registration/components/submission.helper';
import { useLivePrice } from '@/features/registration/components/use-live-price.hook';
import { useRegistrationAnswers } from '@/features/registration/components/use-registration-answers.hook';
import { useRegistrationSteps } from '@/features/registration/components/use-registration-steps.hook';
import { useRegistrationSubmission } from '@/features/registration/components/use-registration-submission.hook';
import { HttpError } from '@/lib/api';

type Path = readonly (string | number)[];

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
  const contact = camp.data?.contactEmail ?? '';
  const cardOffered = camp.data?.cardPayments === true;
  const submit = useRegistrationSubmission(slug, cardOffered, contact);
  const answers = useRegistrationAnswers(form.data?.maxParticipants ?? 1, submit.markEdited);
  const steps = useRegistrationSteps(slug, requestedStep);
  // A link to the form without a Turnus asks for one on the first step; one with it names it in the header.
  const [asksTurnus] = useState(turnusId === undefined);

  const { step } = steps;
  const definition = form.data?.definition;
  const turnus = turnusy.data?.find(({ id }) => id === turnusId);
  const participantFields =
    definition === undefined ? [] : formFields(definition, REGISTRATION_FIELD_CATALOGUE, 'participant');
  const registrationFields =
    definition === undefined ? [] : formFields(definition, REGISTRATION_FIELD_CATALOGUE, 'registration');
  const submission = {
    registration: askedAnswers(answers.registration, registrationFields),
    participants: answers.participants.map((participant) => askedAnswers(participant, participantFields)),
  };
  const price = useLivePrice(slug, definition, turnus, submission);
  const localErrors =
    definition === undefined ? [] : checkSubmission(definition, REGISTRATION_FIELD_CATALOGUE, submission).errors;
  const errors = localErrors.filter(({ path }) => stepOfPath(path) <= steps.checkedUpTo);
  const ageProblemOf = (participant: Answers) => {
    const birthDate = participant.birthDate;

    return turnus === undefined || typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)
      ? null
      : ageProblem(birthDate, turnus);
  };
  const missingDeclarations = (form.data?.declarations ?? []).filter(
    ({ id, mandatory }) => mandatory && !answers.ticked.includes(id),
  );
  const outOfAge = submission.participants.findIndex((participant) => ageProblemOf(participant) !== null);
  // The steps something is wrong at, by what this form can tell; the server checks it all again.
  const problemSteps = [
    ...(turnus === undefined ? [stepNumberOf('guardians')] : []),
    ...localErrors.map(({ path }) => stepOfPath(path)),
    ...(outOfAge === -1 ? [] : [stepNumberOf('children')]),
    ...(missingDeclarations.length === 0 ? [] : [stepNumberOf('summary')]),
  ];
  const localPaths = localErrors.map(({ path }) => path);
  // Shows the first step a list of problems names, and the first problem on it.
  const showProblems = (problems: readonly number[], paths: readonly Path[]) => {
    const first = Math.min(...problems);
    const child = firstChildOf(paths) ?? (outOfAge === -1 ? null : outOfAge);

    if (first === stepNumberOf('children') && child !== null) {
      answers.setActiveChild(child);
    }

    steps.showProblemOn(first);
  };

  return {
    isLoading: camp.isPending || form.isPending || turnusy.isPending,
    hasNoForm: form.error instanceof HttpError && form.error.status === 404,
    isError: camp.isError || turnusy.isError || (form.isError && !(form.error instanceof HttpError)),
    camp: camp.data,
    // Per child, shown on the way to add a sibling.
    siblingDiscount: camp.data?.siblingDiscount?.amount ?? null,
    form: form.data,
    step,
    stepCount: REGISTRATION_STEPS.length,
    // Back to an earlier step from the summary, at the child to change.
    edit: (target: RegistrationStep, child?: number) => {
      if (child !== undefined) {
        answers.setActiveChild(child);
      }

      steps.open(target);
    },
    turnusy: turnusy.data ?? [],
    turnus,
    asksTurnus: asksTurnus || turnus === undefined,
    isTurnusMissing: steps.isChecked('guardians') && turnus === undefined,
    selectTurnus: (id: string) => {
      submit.markEdited();
      void navigate({
        to: '/organisation/$campSlug/prihlaska',
        params: { campSlug: slug },
        search: (previous) => ({ ...previous, turnus: id === '' ? undefined : id }),
        replace: true,
      });
    },
    participantFields,
    registrationFields,
    ...answers,
    // The children with something wrong shown, marked on their chips.
    invalidChildren: answers.participants.flatMap((participant, index) =>
      [...errors, ...submit.refusalFields].some(({ path }) => path[0] === 'participants' && path[1] === index) ||
      (steps.isChecked('children') && ageProblemOf(participant) !== null)
        ? [index]
        : [],
    ),
    ...price,
    setCodeInput: (code: string) => {
      submit.markEdited();
      price.setCodeInput(code);
    },
    // The form's own check first; then what the server refused, such as a child it found too young.
    messageAt: (path: Path) => {
      const error = errors.find((candidate) => samePath(candidate.path, path));

      return error === undefined
        ? submit.refusedMessageAt(path)
        : tCommon(`form.errors.${error.code}`, { ...error.params });
    },
    ageNote: (participant: Answers) => {
      const problem = ageProblemOf(participant);

      return problem === null ? null : t(`age.${problem}`, { min: turnus?.minAge, max: turnus?.maxAge, contact });
    },
    missingDeclarations: steps.isChecked('summary') ? missingDeclarations : [],
    refusalMessage: submit.refusalMessage,
    hasFieldRefusal: submit.hasFieldRefusal,
    isSending: submit.isSending,
    submitted: submit.submitted,
    submittedKey: submit.submittedKey,
    cardOffered,
    byCard: submit.byCard,
    setByCard: submit.setByCard,
    cardStatus: submit.cardStatus,
    // Opens the next step once this one checks out; else shows what is wrong on it.
    next: () => {
      steps.check(step);

      if (problemSteps.includes(step)) {
        showProblems([step], localPaths);

        return;
      }

      steps.advance();
    },
    // Sends the form once it checks out here, else shows the first step with something wrong; the server
    // checks it all again, and its refusals are shown where they belong.
    send: () => {
      steps.check(REGISTRATION_STEPS.length);

      if (problemSteps.length > 0) {
        showProblems(problemSteps, localPaths);

        return;
      }

      if (turnus === undefined) {
        return;
      }

      submit.send(
        {
          turnusId: turnus.id,
          submission,
          paymentChoice: price.paymentChoice,
          discountCode: price.discountCode,
          declarations: (form.data?.declarations ?? []).map(({ id }) => ({
            id,
            accepted: answers.ticked.includes(id),
          })),
        },
        (paths) => showProblems(paths.length === 0 ? [step] : paths.map(stepOfPath), paths),
      );
    },
  };
}

export type RegistrationPageState = ReturnType<typeof useRegistrationPage>;
