import { useAccountQuery } from '@/core/account';
import { useConsoleOrganisationsQuery, useProblemReportsQuery } from '@/features/console/api/console.queries';
import { hasMailWarning } from '@/features/console/components/mail-delivery/mail-health.helper';
import { HttpError } from '@/lib/api';

// What the console shows: the TOTP setup, or the Organisations once this login passed a code.
export type ConsoleStep = 'enrol' | 'organisations';

export function useConsolePage() {
  const account = useAccountQuery();
  const isSignedOut = account.error instanceof HttpError && account.error.status === 401;
  const step: ConsoleStep | undefined =
    account.data === undefined
      ? undefined
      : account.data.totpEnabled && account.data.secondFactor
        ? 'organisations'
        : 'enrol';
  const showsOrganisations = account.data?.operator === true && step === 'organisations';
  const organisations = useConsoleOrganisationsQuery(showsOrganisations);
  const reports = useProblemReportsQuery(showsOrganisations);
  const list = organisations.data ?? [];

  return {
    isSignedOut,
    isNotOperator: account.data?.operator === false,
    // A disabled query stays pending, so only the list that is fetched counts.
    isLoading: account.isPending || (showsOrganisations && organisations.isPending),
    isError: (account.isError && !isSignedOut) || organisations.isError,
    step,
    organisations: list,
    // What waits for the operator, beside each tab.
    counts: {
      organizace: list.filter((organisation) => organisation.status === 'pending').length,
      hlaseni: (reports.data ?? []).filter((report) => report.resolvedAt === null).length,
      emaily: list.filter((organisation) => hasMailWarning(organisation.mail)).length,
      podpora: (account.data?.memberships ?? []).filter((membership) => membership.support !== null).length,
    },
  };
}
