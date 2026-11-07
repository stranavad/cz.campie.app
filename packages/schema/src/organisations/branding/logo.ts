import type { FileContentType } from '@repo/schema/files';

// A logo is shown on every public page and inlined into every generated document, so it is an image and
// small.
export const LOGO_CONTENT_TYPES = ['image/png', 'image/jpeg'] as const satisfies readonly FileContentType[];

export const MAX_LOGO_BYTES = 1024 * 1024;
