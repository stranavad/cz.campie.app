import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PreviewPriceBody } from '@repo/schema/camps';
import type { SubmitRegistrationBody } from '@repo/schema/registrations';

import { registrationKeys } from '@/features/registration/api/registration.keys';
import { registrationService } from '@/features/registration/api/registration.service';

// The declarations' PDF links last five minutes, so the form is fetched again before they run out.
const LINK_REFRESH_MS = 4 * 60 * 1000;

export const useRegistrationCampQuery = (slug: string) =>
  useQuery({ queryKey: registrationKeys.camp(slug), queryFn: ({ signal }) => registrationService.camp(slug, signal) });

export const useRegistrationFormQuery = (slug: string) =>
  useQuery({
    queryKey: registrationKeys.form(slug),
    queryFn: ({ signal }) => registrationService.form(slug, signal),
    refetchInterval: LINK_REFRESH_MS,
    retry: false,
  });

export const useRegistrationTurnusyQuery = (slug: string) =>
  useQuery({
    queryKey: registrationKeys.turnusy(slug),
    queryFn: ({ signal }) => registrationService.turnusy(slug, signal),
  });

// The price of the answers as they settle; the last price stays shown, marked as such, while the next
// one loads.
export const usePricePreviewQuery = (slug: string, body: PreviewPriceBody | null) =>
  useQuery({
    queryKey: registrationKeys.price(slug, body),
    queryFn: body === null ? skipToken : ({ signal }) => registrationService.price(slug, body, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });

// Sends the form; the places left change with it.
export const useSubmitRegistrationMutation = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubmitRegistrationBody) => registrationService.submit(slug, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: registrationKeys.turnusy(slug) }),
  });
};

// Sends the guardian to Comgate once a card payment starts; a refusal leaves bank transfer.
export const useStartCardPaymentMutation = () =>
  useMutation({
    mutationFn: (idempotencyKey: string) => registrationService.startCardPayment(idempotencyKey),
    onSuccess: ({ redirectUrl }) => window.location.assign(redirectUrl),
  });

// Comgate may send the guardian back before it notifies the API: ask again for a minute while pending.
const RESULT_POLLS = 20;

export const useCardPaymentResultQuery = (transactionId: string) =>
  useQuery({
    queryKey: registrationKeys.cardPayment(transactionId),
    queryFn: ({ signal }) => registrationService.cardPaymentResult(transactionId, signal),
    enabled: transactionId !== '',
    retry: false,
    refetchInterval: ({ state }) =>
      state.data?.state === 'pending' && state.dataUpdateCount < RESULT_POLLS ? 3000 : false,
  });
