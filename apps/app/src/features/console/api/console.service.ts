import {
  approveOrganisationEndpoint,
  listConsoleOrganisationsEndpoint,
  listProblemReportsEndpoint,
  previewOrganisationEndpoint,
  rejectOrganisationEndpoint,
  renameOrganisationSubdomainEndpoint,
  resetOwnerTotpEndpoint,
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
  resetOwnerTotp: (organisationId: string, email: string) =>
    apiClient.request(resetOwnerTotpEndpoint, { params: { organisationId }, body: { email } }),
  preview: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(previewOrganisationEndpoint, { params: { organisationId }, signal }),
  reject: (organisationId: string) => apiClient.request(rejectOrganisationEndpoint, { params: { organisationId } }),
  enterSupport: (organisationId: string) => apiClient.request(enterSupportAccessEndpoint, { organisationId }),
  problemReports: (signal?: AbortSignal) => apiClient.request(listProblemReportsEndpoint, { signal }),
  resolveProblemReport: (reportId: string) => apiClient.request(resolveProblemReportEndpoint, { params: { reportId } }),
};
