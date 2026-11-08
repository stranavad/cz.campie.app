import { useState } from 'react';

import { CONSENT_ANSWER_ERROR_CODES, type GuardianConsentParams } from '@repo/schema/consents';

import {
  useGuardianConsentQuery,
  useSignConsentMutation,
  useWithdrawConsentMutation,
} from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

/**
 * A Consent in full for one child, the answers and typed signature being filled in, signing and withdrawing.
 * @param params the Registration, child and Consent
 */
export function useConsentSignForm(params: GuardianConsentParams) {
  const consent = useGuardianConsentQuery(params);
  const sign = useSignConsentMutation(params);
  const withdraw = useWithdrawConsentMutation(params);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [signerName, setSignerName] = useState('');
  const [signerPlace, setSignerPlace] = useState('');
  const refusal = sign.error instanceof HttpError ? readErrorResponse(sign.error.details) : null;

  return {
    consent,
    answers,
    signerName,
    signerPlace,
    setSignerName,
    setSignerPlace,
    problemAt: (itemId: string) => {
      const code = refusal?.fields?.find(({ path }) => path[1] === itemId)?.code;

      return CONSENT_ANSWER_ERROR_CODES.find((known) => known === code);
    },
    answer: (itemId: string, value: boolean) => {
      sign.reset();
      setAnswers({ ...answers, [itemId]: value });
    },
    submit: (consentVersionId: string) => sign.mutate({ consentVersionId, answers, signerName, signerPlace }),
    canSubmit: !sign.isPending && signerName.trim().length >= 3 && signerPlace.trim().length >= 2,
    signFailure: sign.isError
      ? refusal?.code === 'consent_version_outdated'
        ? ('outdated' as const)
        : refusal?.code === 'consent_answers_invalid'
          ? ('answersInvalid' as const)
          : ('signFailed' as const)
      : null,
    confirmWithdraw,
    withdraw: () => (confirmWithdraw ? withdraw.mutate() : setConfirmWithdraw(true)),
    isWithdrawing: withdraw.isPending,
    withdrawFailed: withdraw.isError,
  };
}
