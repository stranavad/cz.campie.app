import { useAccountQuery } from '@/core/account';
import { useConsoleOrganisationsQuery } from '@/features/console/api/console.queries';
import { HttpError } from '@/lib/api';

// What the console shows: the TOTP setup, the code of this login, or the Organisations.
export type ConsoleStep = 'enrol' | 'verify' | 'organisations';

export function useConsolePage() {
  const account = useAccountQuery();
  const isSignedOut = account.error instanceof HttpError && account.error.status === 401;
  const step: ConsoleStep | undefined =
    account.data === undefined
      ? undefined
      : !account.data.totpEnabled
        ? 'enrol'
        : account.data.secondFactor
          ? 'organisations'
          : 'verify';
  const showsOrganisations = account.data?.operator === true && step === 'organisations';
  const organisations = useConsoleOrganisationsQuery(showsOrganisations);

  return {
    isSignedOut,
    isNotOperator: account.data?.operator === false,
    // A disabled query stays pending, so only the list that is fetched counts.
    isLoading: account.isPending || (showsOrganisations && organisations.isPending),
    isError: (account.isError && !isSignedOut) || organisations.isError,
    step,
    organisations: organisations.data ?? [],
  };
}
