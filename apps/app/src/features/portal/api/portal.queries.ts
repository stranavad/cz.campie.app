import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { GuardianConsent, GuardianConsentParams, SignConsentBody } from '@repo/schema/consents';
import type { UploadDocumentParams } from '@repo/schema/documents';
import type {
  AddGuardianBody,
  AnswerNewFieldsBody,
  GuardianContactBody,
  GuardianEdit,
  StartPortalCardPaymentBody,
} from '@repo/schema/portal';

import { portalKeys } from '@/features/portal/api/portal.keys';
import { portalService } from '@/features/portal/api/portal.service';

export const useRequestLoginLinkMutation = () => useMutation({ mutationFn: portalService.requestLink });

export const useGuardianSignInMutation = () => useMutation({ mutationFn: portalService.signIn });

export const useGuardianSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: portalService.signOut,
    onSettled: () => queryClient.removeQueries({ queryKey: portalKeys.all }),
  });
};

// The Přihláška links last five minutes, so the Registrations are fetched again before they run out.
const LINK_REFRESH_MS = 4 * 60 * 1000;

export const useGuardianRegistrationsQuery = () =>
  useQuery({
    queryKey: portalKeys.registrations(),
    queryFn: ({ signal }) => portalService.registrations(signal),
    refetchInterval: LINK_REFRESH_MS,
    retry: false,
  });

export const useGuardianEditQuery = (registrationId: string) =>
  useQuery({
    queryKey: portalKeys.edit(registrationId),
    queryFn: ({ signal }) => portalService.edit(registrationId, signal),
    retry: false,
  });

// Every edit answers with the Registration as it now stands; the overview's price may have changed too.
const useEditMutation = <Variables>(
  registrationId: string,
  mutationFn: (variables: Variables) => Promise<GuardianEdit>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (edit) => {
      queryClient.setQueryData(portalKeys.edit(registrationId), edit);
      void queryClient.invalidateQueries({ queryKey: portalKeys.registrations() });
      void queryClient.invalidateQueries({ queryKey: portalKeys.checklist(registrationId) });
    },
  });
};

export const useUpdateGuardianContactMutation = (registrationId: string) =>
  useEditMutation(registrationId, ({ position, body }: { position: number; body: GuardianContactBody }) =>
    portalService.updateContact(registrationId, position, body),
  );

export const useAddGuardianMutation = (registrationId: string) =>
  useEditMutation(registrationId, (body: AddGuardianBody) => portalService.addGuardian(registrationId, body));

export const useAnswerNewFieldsMutation = (registrationId: string) =>
  useEditMutation(registrationId, (body: AnswerNewFieldsBody) => portalService.answerNewFields(registrationId, body));

export const useRequestEmailChangeMutation = (registrationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ position, email }: { position: number; email: string }) =>
      portalService.requestEmailChange(registrationId, position, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: portalKeys.edit(registrationId) }),
  });
};

export const useConfirmEmailChangeMutation = () => useMutation({ mutationFn: portalService.confirmEmailChange });

// Sends the guardian to Comgate once the card payment starts.
export const useStartPortalCardPaymentMutation = (registrationId: string) =>
  useMutation({
    mutationFn: (amount: StartPortalCardPaymentBody['amount']) =>
      portalService.startCardPayment(registrationId, amount),
    onSuccess: ({ redirectUrl }) => window.location.assign(redirectUrl),
  });

export const useGuardianConsentsQuery = (registrationId: string) =>
  useQuery({
    queryKey: portalKeys.consents(registrationId),
    queryFn: ({ signal }) => portalService.consents(registrationId, signal),
    retry: false,
  });

export const useGuardianConsentQuery = (params: GuardianConsentParams) =>
  useQuery({
    queryKey: portalKeys.consent(params.registrationId, params.participantId, params.consentId),
    queryFn: ({ signal }) => portalService.consent(params, signal),
  });

// A signature or a withdrawal changes the child's state in the list; a signed PDF follows from a job.
function useConsentChange<Variables>(
  params: GuardianConsentParams,
  mutationFn: (variables: Variables) => Promise<GuardianConsent>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (consent) => {
      queryClient.setQueryData(
        portalKeys.consent(params.registrationId, params.participantId, params.consentId),
        consent,
      );
      await queryClient.invalidateQueries({ queryKey: portalKeys.consents(params.registrationId), exact: true });
      await queryClient.invalidateQueries({ queryKey: portalKeys.checklist(params.registrationId) });
    },
  });
}

export const useSignConsentMutation = (params: GuardianConsentParams) =>
  useConsentChange(params, (body: SignConsentBody) => portalService.signConsent(params, body));

export const useWithdrawConsentMutation = (params: GuardianConsentParams) =>
  useConsentChange<void>(params, () => portalService.withdrawConsent(params));

export const useGuardianDocumentsQuery = (registrationId: string) =>
  useQuery({
    queryKey: portalKeys.documents(registrationId),
    queryFn: ({ signal }) => portalService.documents(registrationId, signal),
    retry: false,
  });

// The upload, or the replacement of a document waiting for review, answers the Registration's documents as
// they now are.
export const useUploadDocumentMutation = (registrationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      params,
      file,
      replacing,
    }: {
      params: UploadDocumentParams;
      file: File;
      replacing: string | null;
    }) =>
      replacing === null
        ? portalService.uploadDocument(params, file)
        : portalService.replaceUpload({ registrationId: params.registrationId, uploadId: replacing }, file),
    onSuccess: async (documents) => {
      queryClient.setQueryData(portalKeys.documents(registrationId), documents);
      await queryClient.invalidateQueries({ queryKey: portalKeys.checklist(registrationId) });
    },
  });
};

export const useGuardianChecklistQuery = (registrationId: string) =>
  useQuery({
    queryKey: portalKeys.checklist(registrationId),
    queryFn: ({ signal }) => portalService.checklist(registrationId, signal),
  });
