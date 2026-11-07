import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CampBranding,
  CreateCampBody,
  CreateDiscountCodeBody,
  SaveRegistrationFormDraftBody,
  TurnusBody,
  UpdateCampBody,
  UpdateCampBrandingBody,
  UpdateDiscountCodeBody,
} from '@repo/schema/camps';
import type { ConsentContent } from '@repo/schema/consents';
import type { CampEmailTextBody, EmailType } from '@repo/schema/emails';

import { campsKeys } from '@/features/camps/api/camps.keys';
import { campsService } from '@/features/camps/api/camps.service';

export const useCampsQuery = (organisationId: string, enabled: boolean) =>
  useQuery({
    queryKey: campsKeys.list(organisationId),
    queryFn: ({ signal }) => campsService.list(organisationId, signal),
    enabled,
  });

export const useCampQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campsKeys.detail(organisationId, campId),
    queryFn: ({ signal }) => campsService.get(organisationId, campId, signal),
  });

// The fallback shown follows the Organisation's branding, which another page changes, so it is refetched
// whenever the section opens.
export const useCampBrandingQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campsKeys.branding(organisationId, campId),
    queryFn: ({ signal }) => campsService.getBranding(organisationId, campId, signal),
    refetchOnMount: 'always',
  });

// The list shows names and slugs, so it is refetched after any change.
export const useCreateCampMutation = (organisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCampBody) => campsService.create(organisationId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.list(organisationId) }),
  });
};

export const useUpdateCampMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateCampBody) => campsService.update(organisationId, campId, body),
    onSuccess: async (camp) => {
      queryClient.setQueryData(campsKeys.detail(organisationId, campId), camp);
      await queryClient.invalidateQueries({ queryKey: campsKeys.list(organisationId) });
    },
  });
};

// Every branding change answers with the branding as it now is.
function useBrandingMutation<Variables>(
  organisationId: string,
  campId: string,
  mutationFn: (variables: Variables) => Promise<CampBranding>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (branding) => queryClient.setQueryData(campsKeys.branding(organisationId, campId), branding),
  });
}

export const useUpdateCampBrandingMutation = (organisationId: string, campId: string) =>
  useBrandingMutation(organisationId, campId, (body: UpdateCampBrandingBody) =>
    campsService.updateBranding(organisationId, campId, body),
  );

export const useSetCampLogoMutation = (organisationId: string, campId: string) =>
  useBrandingMutation(organisationId, campId, (file: File) => campsService.setLogo(organisationId, campId, file));

export const useRemoveCampLogoMutation = (organisationId: string, campId: string) =>
  useBrandingMutation<void>(organisationId, campId, () => campsService.removeLogo(organisationId, campId));

export const useTurnusyQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campsKeys.turnusy(organisationId, campId),
    queryFn: ({ signal }) => campsService.listTurnusy(organisationId, campId, signal),
  });

// A Turnus is saved whole, new (no id) or existing; the Camp's list is refetched either way.
export const useSaveTurnusMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ turnusId, body }: { turnusId: string | null; body: TurnusBody }) =>
      turnusId === null
        ? campsService.createTurnus(organisationId, campId, body)
        : campsService.updateTurnus(organisationId, turnusId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.turnusy(organisationId, campId) }),
  });
};

export const useRemoveTurnusMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (turnusId: string) => campsService.removeTurnus(organisationId, turnusId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.turnusy(organisationId, campId) }),
  });
};

export const useDiscountCodesQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campsKeys.discountCodes(organisationId, campId),
    queryFn: ({ signal }) => campsService.listDiscountCodes(organisationId, campId, signal),
  });

export const useCreateDiscountCodeMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateDiscountCodeBody) => campsService.createDiscountCode(organisationId, campId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.discountCodes(organisationId, campId) }),
  });
};

export const useUpdateDiscountCodeMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ discountCodeId, body }: { discountCodeId: string; body: UpdateDiscountCodeBody }) =>
      campsService.updateDiscountCode(organisationId, discountCodeId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.discountCodes(organisationId, campId) }),
  });
};

export const useRemoveDiscountCodeMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (discountCodeId: string) => campsService.removeDiscountCode(organisationId, discountCodeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.discountCodes(organisationId, campId) }),
  });
};

// Its PDF links last five minutes, so it is fetched again before they run out.
const LINK_REFRESH_MS = 4 * 60 * 1000;

export const useRegistrationFormQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campsKeys.registrationForm(organisationId, campId),
    queryFn: ({ signal }) => campsService.getRegistrationForm(organisationId, campId, signal),
    refetchInterval: LINK_REFRESH_MS,
  });

// Saves the draft, and publishes it when asked, so what is published is what the builder shows. A
// refused publish leaves the draft saved.
export const useSaveRegistrationFormMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draft, publish }: { draft: SaveRegistrationFormDraftBody; publish: boolean }) => {
      await campsService.saveRegistrationFormDraft(organisationId, campId, draft);

      return publish ? campsService.publishRegistrationForm(organisationId, campId) : null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.registrationForm(organisationId, campId) }),
  });
};

export const useUploadDeclarationFileMutation = (organisationId: string, campId: string) =>
  useMutation({ mutationFn: (file: File) => campsService.uploadDeclarationFile(organisationId, campId, file) });

export const useEmailTextsQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campsKeys.emailTexts(organisationId, campId),
    queryFn: ({ signal }) => campsService.listEmailTexts(organisationId, campId, signal),
  });

export const useSaveEmailTextMutation = (organisationId: string, campId: string, type: EmailType) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CampEmailTextBody | null) =>
      body === null
        ? campsService.resetEmailText(organisationId, campId, type)
        : campsService.saveEmailText(organisationId, campId, type, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campsKeys.emailTexts(organisationId, campId) }),
  });
};

export const usePreviewEmailTextMutation = (organisationId: string, campId: string, type: EmailType) =>
  useMutation({
    mutationFn: (body: Pick<CampEmailTextBody, 'subject' | 'text'>) =>
      campsService.previewEmailText(organisationId, campId, type, body),
  });

export const useCampPreviewQuery = (organisationId: string, campId: string, enabled: boolean) =>
  useQuery({
    queryKey: campsKeys.preview(organisationId, campId),
    queryFn: ({ signal }) => campsService.preview(organisationId, campId, signal),
    enabled,
  });

export const useConsentsQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campsKeys.consents(organisationId, campId),
    queryFn: ({ signal }) => campsService.consents(organisationId, campId, signal),
  });

export const useConsentQuery = (organisationId: string, campId: string, consentId: string | null) =>
  useQuery({
    queryKey: campsKeys.consent(organisationId, campId, consentId ?? ''),
    queryFn:
      consentId === null ? skipToken : ({ signal }) => campsService.consent(organisationId, campId, consentId, signal),
  });

// Creating or publishing answers the Consent with every version; the list shows its newest.
export const useSaveConsentMutation = (organisationId: string, campId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consentId, content }: { consentId: string | null; content: ConsentContent }) =>
      consentId === null
        ? campsService.createConsent(organisationId, campId, content)
        : campsService.publishConsent(organisationId, campId, consentId, content),
    onSuccess: (consent) => {
      queryClient.setQueryData(campsKeys.consent(organisationId, campId, consent.id), consent);
      return queryClient.invalidateQueries({ queryKey: campsKeys.consents(organisationId, campId), exact: true });
    },
  });
};

export const useUploadConsentFileMutation = (organisationId: string, campId: string) =>
  useMutation({ mutationFn: (file: File) => campsService.uploadConsentFile(organisationId, campId, file) });
