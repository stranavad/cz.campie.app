import { z } from 'zod';

import { defineEndpoint, emailSchema } from '@repo/schema/shared';

// An admin's feedback or problem from an admin page, or a guardian's technical problem from the
// Organisation's pages: each reaches the Platform operator, never the camp.
export const PROBLEM_REPORT_KINDS = ['admin', 'guardian'] as const;

export type ProblemReportKind = (typeof PROBLEM_REPORT_KINDS)[number];

const reportFields = {
  // The page the report was sent from, as the browser has it.
  pageUrl: z.string().trim().max(500),
  text: z.string().trim().min(5).max(5000),
};

export const sendFeedbackBodySchema = z.object(reportFields);

export type SendFeedbackBody = z.infer<typeof sendFeedbackBodySchema>;

// An admin's feedback or problem report, with their Organisation and account attached; any member.
export const sendFeedbackEndpoint = defineEndpoint({
  method: 'POST',
  path: '/feedback',
  body: sendFeedbackBodySchema,
});

export const reportProblemBodySchema = z.object({
  ...reportFields,
  // Where the operator may answer, if the guardian wants an answer.
  email: z.union([z.literal('').transform(() => null), z.null(), emailSchema]).default(null),
});

export type ReportProblemBody = z.infer<typeof reportProblemBodySchema>;

// A technical problem from the Organisation's public pages or portal, with the Organisation attached and
// nothing of the family but what was typed; limited per address and Organisation.
export const reportProblemEndpoint = defineEndpoint({
  method: 'POST',
  path: '/problem-reports',
  body: reportProblemBodySchema,
});

export const problemReportSchema = z.object({
  id: z.uuid(),
  kind: z.enum(PROBLEM_REPORT_KINDS),
  organisation: z.object({ id: z.uuid(), displayName: z.string() }).nullable(),
  // The admin's email for an admin report, the guardian's own if they gave one.
  from: z.string().nullable(),
  pageUrl: z.string(),
  text: z.string(),
  sentAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().nullable(),
});

export type ProblemReport = z.infer<typeof problemReportSchema>;

// The reports, open first, then newest first; the operator's console.
export const listProblemReportsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/console/problem-reports',
  response: z.array(problemReportSchema),
});

export const problemReportParamsSchema = z.object({ reportId: z.uuid() });

export type ProblemReportParams = z.infer<typeof problemReportParamsSchema>;

// Marks a report dealt with; the operator's console.
export const resolveProblemReportEndpoint = defineEndpoint({
  method: 'POST',
  path: '/console/problem-reports/:reportId/resolve',
  params: problemReportParamsSchema,
  response: problemReportSchema,
});
