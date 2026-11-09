import { UPLOAD_CONTENT_TYPES } from '@repo/schema/files';

// What the server takes as a document: a file may be any of them, a photo only an image of them.
export const FILE_ACCEPT = UPLOAD_CONTENT_TYPES.join(',');
export const PHOTO_ACCEPT = UPLOAD_CONTENT_TYPES.filter((type) => type.startsWith('image/')).join(',');
