// Groups of four, as authenticator apps print a key, so it is easier to type in.
export function groupSecret(secret: string): string {
  return secret.replaceAll(/(.{4})(?=.)/g, '$1 ');
}
