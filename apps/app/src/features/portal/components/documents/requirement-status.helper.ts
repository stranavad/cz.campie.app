import type { GuardianUpload, UploadStatus } from '@repo/schema/documents';

/**
 * A child's state for a document requirement: its newest upload's, or missing before any.
 * @param uploads what the child handed in for it, newest first
 */
export function statusOf(uploads: readonly GuardianUpload[]): UploadStatus | 'missing' {
  return uploads.at(0)?.status ?? 'missing';
}

/**
 * Whether the guardian still has to hand the document in: nothing yet, or it came back for a fix.
 * @param uploads what the child handed in for it, newest first
 */
export function needsAction(uploads: readonly GuardianUpload[]): boolean {
  const status = statusOf(uploads);

  return status === 'missing' || status === 'returned';
}
