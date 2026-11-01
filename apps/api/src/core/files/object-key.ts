/**
 * Name a file's object in storage: by Organisation, so all of one Organisation's objects share a prefix,
 * and by id only, since the file's name may be personal.
 * @param organisationId the file's Organisation
 * @param fileId the file's id
 */
export function objectKey(organisationId: string, fileId: string): string {
  return `${organisationId}/${fileId}`;
}
