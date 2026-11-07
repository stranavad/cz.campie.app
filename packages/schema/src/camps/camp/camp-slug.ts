import { z } from 'zod';

// Paths at the root of an Organisation's subdomain that are not Camps: the guardian portal, its login and
// logout, the API. A Camp's slug sits beside them.
export const RESERVED_CAMP_SLUGS = ['api', 'portal', 'prihlaseni', 'odhlaseni'] as const;

// Lowercase letters, digits and single hyphens between them.
const CAMP_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const MAX_LENGTH = 80;

// Codes of a slug a Camp cannot have, which the app translates; only the API knows a taken one.
export const CAMP_SLUG_ERROR_CODES = ['camp_slug_malformed', 'camp_slug_reserved', 'camp_slug_taken'] as const;

export type CampSlugErrorCode = (typeof CAMP_SLUG_ERROR_CODES)[number];

/**
 * Tell why a slug cannot be a Camp's, apart from being taken.
 * @param slug the slug as entered
 */
export function campSlugProblem(slug: string): Exclude<CampSlugErrorCode, 'camp_slug_taken'> | null {
  if (slug.length > MAX_LENGTH || !CAMP_SLUG_PATTERN.test(slug)) {
    return 'camp_slug_malformed';
  }

  return (RESERVED_CAMP_SLUGS as readonly string[]).includes(slug) ? 'camp_slug_reserved' : null;
}

// A Camp's slug as entered: trimmed and lowercased, then checked.
export const campSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((slug, context) => {
    const problem = campSlugProblem(slug);

    if (problem !== null) {
      context.addIssue({ code: 'custom', message: problem });
    }
  });
