import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';

import type { PreviewPriceBody } from '@repo/schema/camps';

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
