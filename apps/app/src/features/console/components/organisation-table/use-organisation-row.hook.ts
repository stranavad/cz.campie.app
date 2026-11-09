import { useState } from 'react';

import { CONSOLE_ERROR_CODES, type ConsoleOrganisation } from '@repo/schema/console';
import { SUBDOMAIN_ERROR_CODES } from '@repo/schema/organisations';

import {
  useApproveOrganisationMutation,
  useRejectOrganisationMutation,
  useRenameOrganisationMutation,
  useSuspendOrganisationMutation,
} from '@/features/console/api/console.queries';
import { bounceRateOf, hasMailWarning } from '@/features/console/components/mail-delivery/mail-health.helper';
import { HttpError } from '@/lib/api';

const KNOWN_FAILURES = [...CONSOLE_ERROR_CODES, ...SUBDOMAIN_ERROR_CODES] as const;

export type OrganisationRowFailure = (typeof KNOWN_FAILURES)[number] | 'unexpected';

// Rejecting deletes the Organisation and suspending takes it offline, so both ask once more.
type Confirming = 'reject' | 'suspend' | null;

function failureOf(error: Error | null): OrganisationRowFailure | null {
  if (error === null) {
    return null;
  }

  const code = error instanceof HttpError ? error.code : undefined;

  return KNOWN_FAILURES.find((known) => known === code) ?? 'unexpected';
}

export function useOrganisationRow(organisation: ConsoleOrganisation) {
  const approve = useApproveOrganisationMutation();
  const suspend = useSuspendOrganisationMutation();
  const reject = useRejectOrganisationMutation();
  const rename = useRenameOrganisationMutation();
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [subdomain, setSubdomain] = useState(organisation.subdomain);
  const mutations = [approve, suspend, reject, rename];
  // Only the latest action's failure is shown: an earlier one no longer applies.
  const clearFailures = () => {
    for (const mutation of mutations) {
      mutation.reset();
    }
  };

  return {
    bounceRate: bounceRateOf(organisation.mail),
    mailWarning: hasMailWarning(organisation.mail),
    failure: failureOf(mutations.find((mutation) => mutation.error !== null)?.error ?? null),
    isBusy: mutations.some((mutation) => mutation.isPending),
    confirming,
    subdomain,
    setSubdomain,
    approve: () => {
      clearFailures();
      approve.mutate(organisation.id);
    },
    askToConfirm: (action: Exclude<Confirming, null>) => setConfirming(action),
    cancel: () => setConfirming(null),
    suspend: () => {
      clearFailures();
      suspend.mutate(organisation.id, { onSettled: () => setConfirming(null) });
    },
    reject: () => {
      clearFailures();
      reject.mutate(organisation.id, { onSettled: () => setConfirming(null) });
    },
    rename: () => {
      clearFailures();
      rename.mutate({ organisationId: organisation.id, body: { subdomain } });
    },
  };
}

// What a row's parts read and call.
export type OrganisationRowState = ReturnType<typeof useOrganisationRow>;
