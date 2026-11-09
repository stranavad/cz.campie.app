import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FORM_ANSWER_ERROR_CODES } from '@repo/schema/form-engine';
import { SUBMISSION_FIELD_ERROR_CODES, type SubmitRegistrationBody } from '@repo/schema/registrations';

import {
  useStartCardPaymentMutation,
  useSubmitRegistrationMutation,
} from '@/features/registration/api/registration.queries';
import { refusalKeyOf, refusalOf, samePath } from '@/features/registration/components/submission.helper';

type Path = readonly (string | number)[];

/**
 * Sending the form and, when the guardian chose it, paying by card right after; what the server refused.
 * @param slug the Camp's slug
 * @param cardOffered whether the Organisation takes card payments
 * @param contact the Camp's contact email, named in some refusals
 */
export function useRegistrationSubmission(slug: string, cardOffered: boolean, contact: string) {
  const { t } = useTranslation('registration');
  const { t: tCommon } = useTranslation();
  const sending = useSubmitRegistrationMutation(slug);
  const card = useStartCardPaymentMutation();
  const [byCard, setByCard] = useState(false);
  // The key of the last sent form: sending the same form again, as after a lost response, reuses it, so
  // one Registration comes of it; a changed form gets a new one.
  const [lastSent, setLastSent] = useState<{ key: string; content: string } | null>(null);
  const refusal = refusalOf(sending.error);

  return {
    refusalFields: refusal.fields,
    // A change of the answers makes the server's last refusal stale.
    markEdited: () => {
      if (sending.isError) {
        sending.reset();
      }
    },
    // What the server refused at a field, such as a child it found too young.
    refusedMessageAt: (path: Path) => {
      const refused = refusal.fields.find((candidate) => samePath(candidate.path, path));

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
        : t(`refused.${submissionCode}`, { ...refused.params, contact });
    },
    // Why the server refused the whole submission, when no field explains it.
    refusalMessage:
      refusal.code === null || refusal.fields.length > 0 ? null : t(`refused.${refusalKeyOf(refusal.code)}`),
    hasFieldRefusal: refusal.fields.length > 0,
    isSending: sending.isPending,
    submitted: sending.data,
    byCard: cardOffered && byCard,
    setByCard,
    // Once the Registration is in, a card payment is on its way to Comgate, or failed and leaves bank transfer.
    cardStatus: card.isError ? ('failed' as const) : card.isIdle ? null : ('redirecting' as const),
    /**
     * Send the form; a card payment starts once it is in.
     * @param body the form, without its key
     * @param onRefused called with the paths of the fields the server refused, none when no field explains it
     */
    send: (body: Omit<SubmitRegistrationBody, 'idempotencyKey'>, onRefused: (paths: Path[]) => void) => {
      if (sending.isPending) {
        return;
      }

      const content = JSON.stringify(body);
      const key = lastSent?.content === content ? lastSent.key : crypto.randomUUID();

      setLastSent({ key, content });
      sending.mutate(
        { ...body, idempotencyKey: key },
        {
          onSuccess: () => (cardOffered && byCard ? card.mutate(key) : undefined),
          onError: (error) => onRefused(refusalOf(error).fields.map(({ path }) => path)),
        },
      );
    },
  };
}
