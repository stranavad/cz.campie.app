import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { defineEndpoint } from '@repo/schema/shared';

import { participantListParamsSchema } from '../participant-list/participant-list.contracts.ts';

// An export is made by a job: waiting until its file is stored.
export const EXPORT_STATUSES = ['pending', 'ready'] as const;

export const participantExportSchema = z.object({
  id: z.uuid(),
  status: z.enum(EXPORT_STATUSES),
  // A download link for a few minutes once the file is ready.
  file: fileLinkSchema.nullable(),
});

export type ParticipantExport = z.infer<typeof participantExportSchema>;

// Starts an Excel export of a Turnus's Participants with every column the admin may see; Registrations read.
export const startParticipantExportEndpoint = defineEndpoint({
  method: 'POST',
  path: '/turnusy/:turnusId/exports',
  params: participantListParamsSchema,
  response: participantExportSchema,
});

export const participantExportParamsSchema = z.object({ exportId: z.uuid() });

export type ParticipantExportParams = z.infer<typeof participantExportParamsSchema>;

// An export the admin started, with its file once ready; Registrations read.
export const getParticipantExportEndpoint = defineEndpoint({
  method: 'GET',
  path: '/exports/:exportId',
  params: participantExportParamsSchema,
  response: participantExportSchema,
});
