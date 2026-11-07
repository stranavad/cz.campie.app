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
  type FormField,
} from '@repo/schema/form-engine';
import {
  SUBMISSION_ERROR_CODES,
  SUBMISSION_FIELD_ERROR_CODES,
  type SubmissionErrorCode,
} from '@repo/schema/registrations';
import type { FieldError } from '@repo/schema/shared';

import {
  useRegistrationCampQuery,
  useRegistrationFormQuery,
  useRegistrationTurnusyQuery,
  useStartCardPaymentMutation,
  useSubmitRegistrationMutation,
} from '@/features/registration/api/registration.queries';
import { useLivePrice } from '@/features/registration/components/use-live-price.hook';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

const samePath = (one: readonly (string | number)[], other: readonly (string | number)[]) =>
  one.length === other.length && one.every((part, index) => part === other[index]);

/**
 * Read why the server refused a submission: its code and the reasons at the fields.
 * @param error what the submission failed with
 */
function refusalOf(error: Error | null): { code: string | null; fields: readonly FieldError[] } {
  if (error === null) {
    return { code: null, fields: [] };
  }

  const response = error instanceof HttpError ? readErrorResponse(error.details) : null;

  return { code: response?.code ?? 'unknown', fields: response?.fields ?? [] };
}

/**
 * Name the message of a refusal that no field explains.
 * @param code the error response's code
 */
function refusalKeyOf(code: string): SubmissionErrorCode | 'requests_throttled' | 'unknown' {
  return [...SUBMISSION_ERROR_CODES, 'requests_throttled' as const].find((known) => known === code) ?? 'unknown';
}

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
  const errors = isChecking ? localErrors : [];
  const ageProblemOf = (answers: Answers) => {
    const birthDate = answers.birthDate;

    return turnus === undefined || typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)
      ? null
      : ageProblem(birthDate, turnus);
  };
  const missingDeclarations = (form.data?.declarations ?? []).filter(
    ({ id, mandatory }) => mandatory && !ticked.includes(id),
  );
  const isComplete =
    turnus !== undefined &&
    localErrors.length === 0 &&
    missingDeclarations.length === 0 &&
    submission.participants.every((answers) => ageProblemOf(answers) === null);

  return {
    isLoading: camp.isPending || form.isPending || turnusy.isPending,
    hasNoForm: form.error instanceof HttpError && form.error.status === 404,
    isError: camp.isError || turnusy.isError || (form.isError && !(form.error instanceof HttpError)),
    camp: camp.data,
    form: form.data,
    turnusy: turnusy.data ?? [],
    turnus,
    selectTurnus: (id: string) => {
      edited();
      void navigate({
        to: '/organisation/$campSlug/prihlaska',
        params: { campSlug: slug },
        search: { turnus: id === '' ? undefined : id },
        replace: true,
      });
    },
    participantFields,
    registrationFields,
    participants,
    setParticipantAnswer: (index: number, key: string, value: AnswerValue) => {
      edited();
      setParticipants(participants.map((answers, at) => (at === index ? { ...answers, [key]: value } : answers)));
    },
    addParticipant: () => {
      edited();
      setParticipants([...participants, {}]);
    },
    removeParticipant: (index: number) => {
      edited();
      setParticipants(participants.filter((_, at) => at !== index));
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
    isChecking,
    missingDeclarations: isChecking ? missingDeclarations : [],
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
    // Sends the form once it checks out here; the server checks it all again.
    send: () => {
      setChecking(true);

      if (isComplete && turnus !== undefined && !sending.isPending) {
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
          { onSuccess: () => (cardOffered && byCard ? card.mutate(key) : undefined) },
        );
      }
    },
  };
}
