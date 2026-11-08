import { slugify } from '@repo/schema/shared';

// Names that address the platform itself, or could pass for it: staging's own domain and the mail
// domains' subdomains among them.
export const RESERVED_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'staging',
  'mail',
  'auth',
  'posta',
  'static',
  'cdn',
  'status',
  'help',
  'docs',
  'blog',
] as const;

// One DNS label of lowercase letters, digits and single hyphens between them. A double hyphen is refused,
// so no name reads as punycode (xn--).
const SUBDOMAIN_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const MAX_LENGTH = 63;

// Codes of a subdomain an Organisation cannot have, which the app translates.
export const SUBDOMAIN_ERROR_CODES = ['subdomain_malformed', 'subdomain_reserved', 'subdomain_taken'] as const;

export type SubdomainErrorCode = (typeof SUBDOMAIN_ERROR_CODES)[number];

/**
 * Tell why a subdomain cannot be an Organisation's, apart from being taken, which only the API knows.
 * @param subdomain the subdomain as entered
 * @param productName the configured product name, reserved as it would be written in an address
 */
export function subdomainProblem(
  subdomain: string,
  productName: string,
): Exclude<SubdomainErrorCode, 'subdomain_taken'> | null {
  if (subdomain.length > MAX_LENGTH || !SUBDOMAIN_PATTERN.test(subdomain)) {
    return 'subdomain_malformed';
  }

  const reserved: readonly string[] = [...RESERVED_SUBDOMAINS, slugify(productName)];

  return reserved.includes(subdomain) ? 'subdomain_reserved' : null;
}
