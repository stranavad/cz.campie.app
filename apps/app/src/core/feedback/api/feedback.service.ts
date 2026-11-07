import { reportProblemEndpoint, sendFeedbackEndpoint, type ReportProblemBody } from '@repo/schema/console';

import { apiClient } from '@/lib/api';

export const feedbackService = {
  // An admin's feedback, sent in their Organisation.
  send: (organisationId: string, text: string, pageUrl: string) =>
    apiClient.request(sendFeedbackEndpoint, { organisationId, body: { text, pageUrl } }),
  // A technical problem from an Organisation's own pages.
  report: (body: ReportProblemBody) => apiClient.request(reportProblemEndpoint, { body }),
};
