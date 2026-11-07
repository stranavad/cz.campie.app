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

// The export's own columns, in the order the file has them; the form's columns sit between the guardians
// and the money. Their headers are the platform's, translated by the app.
export const FIXED_EXPORT_COLUMNS = [
  'lastName',
  'firstName',
  'birthDate',
  'ageOnStart',
  'status',
  'variableSymbol',
  'submittedAt',
  'guardianName',
  'guardianEmail',
  'guardianPhone',
  'secondGuardianName',
  'secondGuardianEmail',
  'secondGuardianPhone',
  'total',
  'paid',
  'balance',
  'paymentStatus',
  'amountDueNow',
  'dueDate',
  'overdue',
] as const;

export type FixedExportColumn = (typeof FIXED_EXPORT_COLUMNS)[number];

// A form field's column is named `field:<key>`, by the field's key or custom field id.
export const exportColumnIdSchema = z.union([z.enum(FIXED_EXPORT_COLUMNS), z.string().regex(/^field:[\w-]{1,64}$/)]);

export const exportColumnsSchema = z.array(exportColumnIdSchema).min(1).max(200);

export const exportPresetSchema = z.object({ id: z.uuid(), name: z.string(), columns: z.array(z.string()) });

export type ExportPreset = z.infer<typeof exportPresetSchema>;

// What an export of a Turnus can hold: the form's columns of every published version (removed ones
// marked), the Camp's presets shared in the Organisation, and the admin's last selection for the Camp.
export const exportOptionsSchema = z.object({
  formColumns: z.array(
    z.object({
      id: z.string(),
      // A custom field's label; null for a standard field, named by its i18n key.
      label: z.string().nullable(),
      labelKey: z.string().nullable(),
      removed: z.boolean(),
    }),
  ),
  presets: z.array(exportPresetSchema),
  lastSelection: z.array(z.string()).nullable(),
});

export type ExportOptions = z.infer<typeof exportOptionsSchema>;

// Registrations read.
export const getExportOptionsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId/export-options',
  params: participantListParamsSchema,
  response: exportOptionsSchema,
});

export const startParticipantExportBodySchema = z
  .object({
    // The columns to export, remembered as the admin's last selection for the Camp; every column without.
    columns: exportColumnsSchema.optional(),
  })
  .default({});

export type StartParticipantExportBody = z.infer<typeof startParticipantExportBodySchema>;

// Starts an Excel export of a Turnus's Participants with the chosen columns the admin may see, audited;
// Registrations read.
export const startParticipantExportEndpoint = defineEndpoint({
  method: 'POST',
  path: '/turnusy/:turnusId/exports',
  params: participantListParamsSchema,
  body: startParticipantExportBodySchema,
  response: participantExportSchema,
});

export const campExportPresetsParamsSchema = z.object({ campId: z.uuid() });

export type CampExportPresetsParams = z.infer<typeof campExportPresetsParamsSchema>;

export const saveExportPresetBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  columns: exportColumnsSchema,
});

export type SaveExportPresetBody = z.infer<typeof saveExportPresetBodySchema>;

// Saves a named preset of columns for a Camp, shared with the Organisation's admins; Registrations read.
export const saveExportPresetEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/export-presets',
  params: campExportPresetsParamsSchema,
  body: saveExportPresetBodySchema,
  response: exportPresetSchema,
});

export const exportPresetParamsSchema = z.object({ presetId: z.uuid() });

export type ExportPresetParams = z.infer<typeof exportPresetParamsSchema>;

// Registrations read.
export const removeExportPresetEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/export-presets/:presetId',
  params: exportPresetParamsSchema,
});

// Starts an Excel export of the Organisation's whole payment ledger for its accountant: every entry with
// its Registration's Variable symbol, erased Registrations' included; audited; Registrations read.
export const startPaymentsExportEndpoint = defineEndpoint({
  method: 'POST',
  path: '/payment-exports',
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
