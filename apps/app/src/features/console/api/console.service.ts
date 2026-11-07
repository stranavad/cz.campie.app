import {
  confirmTotpEnrolmentEndpoint,
  startTotpEnrolmentEndpoint,
  verifyTotpEndpoint,
  type ConfirmTotpEnrolmentBody,
  type VerifyTotpBody,
} from '@repo/schema/admins';
import {
  approveOrganisationEndpoint,
  listConsoleOrganisationsEndpoint,
  listProblemReportsEndpoint,
  rejectOrganisationEndpoint,
  renameOrganisationSubdomainEndpoint,
  resolveProblemReportEndpoint,
  suspendOrganisationEndpoint,
  type RenameOrganisationSubdomainBody,
} from '@repo/schema/console';
import { enterSupportAccessEndpoint } from '@repo/schema/organisations';

import { apiClient } from '@/lib/api';

export const consoleService = {
  listOrganisations: (signal?: AbortSignal) => apiClient.request(listConsoleOrganisationsEndpoint, { signal }),
  approve: (organisationId: string) => apiClient.request(approveOrganisationEndpoint, { params: { organisationId } }),
  suspend: (organisationId: string) => apiClient.request(suspendOrganisationEndpoint, { params: { organisationId } }),
  rename: (organisationId: string, body: RenameOrganisationSubdomainBody) =>
    apiClient.request(renameOrganisationSubdomainEndpoint, { params: { organisationId }, body }),
  reject: (organisationId: string) => apiClient.request(rejectOrganisationEndpoint, { params: { organisationId } }),
  startTotpEnrolment: () => apiClient.request(startTotpEnrolmentEndpoint),
  confirmTotpEnrolment: (body: ConfirmTotpEnrolmentBody) => apiClient.request(confirmTotpEnrolmentEndpoint, { body }),
  verifyTotp: (body: VerifyTotpBody) => apiClient.request(verifyTotpEndpoint, { body }),
  enterSupport: (organisationId: string) => apiClient.request(enterSupportAccessEndpoint, { organisationId }),
  problemReports: (signal?: AbortSignal) => apiClient.request(listProblemReportsEndpoint, { signal }),
  resolveProblemReport: (reportId: string) => apiClient.request(resolveProblemReportEndpoint, { params: { reportId } }),
};
