import { signUpOrganisationBodySchema, subdomainProblem } from '@repo/schema/organisations';

import { config } from '@/config';
import { useSubdomainAvailabilityQuery } from '@/features/signup/api/signup.queries';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

// How long the Owner pauses typing before the subdomain is checked, so typing asks the API once.
const CHECK_DELAY_MS = 600;

/**
 * Whether the subdomain being typed is free, asked once typing pauses and only for a well-formed name that
 * is not reserved: the form tells those itself. Advisory: the signup checks again.
 * @param value the field's value as typed
 */
export function useSubdomainAvailability(value: string) {
  const subdomain = signUpOrganisationBodySchema.shape.subdomain.parse(value);
  const settled = useDebouncedValue(subdomain, CHECK_DELAY_MS);
  const checkable =
    settled === subdomain && subdomain !== '' && subdomainProblem(subdomain, config.productName) === null;
  const { data, isError } = useSubdomainAvailabilityQuery(checkable ? subdomain : null);
  const availability = checkable ? (data?.availability ?? null) : null;

  return {
    isAvailable: availability === 'available',
    // Why a signup would refuse it now.
    refusal: availability === null || availability === 'available' ? null : availability,
    // Unanswered, such as past the limit of checks: the signup tells.
    isUnchecked: checkable && isError,
  };
}
