import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ageProblem, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { checkSubmission, formFields, type Answers, type AnswerValue, type FormField } from '@repo/schema/form-engine';

import {
  useRegistrationCampQuery,
  useRegistrationFormQuery,
  useRegistrationTurnusyQuery,
} from '@/features/registration/api/registration.queries';
import { useLivePrice } from '@/features/registration/components/use-live-price.hook';
import { HttpError } from '@/lib/api';

/**
 * Keep only the answers to fields the form asks now: a newer version may have removed one.
 * @param answers the answers
 * @param fields the fields asked
 */
function askedAnswers(answers: Answers, fields: readonly FormField[]): Answers {
  return Object.fromEntries(Object.entries(answers).filter(([key]) => fields.some((field) => field.key === key)));
}

// The public form as the guardian fills it in: the Turnus (kept in the address), the children, the
// guardians, the declarations, the live price, and what is wrong once they ask to check it.
export function useRegistrationPage(slug: string, turnusId: string | undefined) {
  const { t } = useTranslation('registration');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const camp = useRegistrationCampQuery(slug);
  const form = useRegistrationFormQuery(slug);
  const turnusy = useRegistrationTurnusyQuery(slug);
  const [participants, setParticipants] = useState<Answers[]>([{}]);
  const [registration, setRegistration] = useState<Answers>({});
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [isChecking, setChecking] = useState(false);
  const [hasSecondGuardian, setSecondGuardian] = useState(false);

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
  const errors =
    isChecking && definition !== undefined
      ? checkSubmission(definition, REGISTRATION_FIELD_CATALOGUE, submission).errors
      : [];
  const ageProblemOf = (answers: Answers) => {
    const birthDate = answers.birthDate;

    return turnus === undefined || typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)
      ? null
      : ageProblem(birthDate, turnus);
  };
  const missingDeclarations = (form.data?.declarations ?? []).filter(
    ({ id, mandatory }) => mandatory && !ticked.includes(id),
  );

  return {
    isLoading: camp.isPending || form.isPending || turnusy.isPending,
    hasNoForm: form.error instanceof HttpError && form.error.status === 404,
    isError: camp.isError || turnusy.isError || (form.isError && !(form.error instanceof HttpError)),
    camp: camp.data,
    form: form.data,
    turnusy: turnusy.data ?? [],
    turnus,
    selectTurnus: (id: string) =>
      void navigate({
        to: '/organisation/$campSlug/prihlaska',
        params: { campSlug: slug },
        search: { turnus: id === '' ? undefined : id },
        replace: true,
      }),
    participantFields,
    registrationFields,
    participants,
    setParticipantAnswer: (index: number, key: string, value: AnswerValue) =>
      setParticipants(participants.map((answers, at) => (at === index ? { ...answers, [key]: value } : answers))),
    addParticipant: () => setParticipants([...participants, {}]),
    removeParticipant: (index: number) => setParticipants(participants.filter((_, at) => at !== index)),
    canAddParticipant: participants.length < (form.data?.maxParticipants ?? 1),
    registration,
    setRegistrationAnswer: (key: string, value: AnswerValue) => setRegistration({ ...registration, [key]: value }),
    hasSecondGuardian,
    setSecondGuardian,
    ...price,
    ticked,
    tick: (id: string, checked: boolean) =>
      setTicked(checked ? [...ticked, id] : ticked.filter((tickedId) => tickedId !== id)),
    messageAt: (path: readonly (string | number)[]) => {
      const error = errors.find((candidate) => candidate.path.join('/') === path.join('/'));

      return error === undefined ? null : tCommon(`form.errors.${error.code}`, { ...error.params });
    },
    ageNote: (answers: Answers) => {
      const problem = ageProblemOf(answers);

      return problem === null
        ? null
        : t(`age.${problem}`, { min: turnus?.minAge, max: turnus?.maxAge, contact: camp.data?.contactEmail ?? '' });
    },
    isChecking,
    missingDeclarations: isChecking ? missingDeclarations : [],
    // Ready only with a Turnus, every answer right, every child within its limits and the declarations ticked.
    isReady:
      isChecking &&
      turnus !== undefined &&
      errors.length === 0 &&
      missingDeclarations.length === 0 &&
      submission.participants.every((answers) => ageProblemOf(answers) === null),
    check: () => setChecking(true),
  };
}
