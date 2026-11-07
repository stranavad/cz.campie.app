// What an upload may be, told by its content, not only by its name.
export const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Every type the platform stores: what people upload, and spreadsheets it generates itself.
export const FILE_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', XLSX_CONTENT_TYPE] as const;

// What an upload may be, whatever a feature allows: a spreadsheet is a zip, which nobody uploads.
export const UPLOAD_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type FileContentType = (typeof FILE_CONTENT_TYPES)[number];

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Codes of a rejected upload, which the app translates.
export const FILE_ERROR_CODES = ['file_missing', 'file_too_large', 'file_type_not_allowed'] as const;

export type FileErrorCode = (typeof FILE_ERROR_CODES)[number];
