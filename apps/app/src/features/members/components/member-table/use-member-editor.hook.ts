import { useState } from 'react';

import type { Member, Permissions } from '@repo/schema/admins';

import {
  useRemoveMemberMutation,
  useResetMemberTotpMutation,
  useUpdateMemberMutation,
} from '@/features/members/api/members.queries';
import { HttpError } from '@/lib/api';

export type MemberEditorFailure = 'last_owner' | 'totp_reset_elsewhere' | 'unexpected';

const KNOWN_FAILURES = ['last_owner', 'totp_reset_elsewhere'] as const;

export function useMemberEditor(organisationId: string, member: Member) {
  const update = useUpdateMemberMutation(organisationId);
  const remove = useRemoveMemberMutation(organisationId);
  const resetTotp = useResetMemberTotpMutation(organisationId);
  const [isConfirmingRemoval, setConfirmingRemoval] = useState(false);
  const [isConfirmingTotpReset, setConfirmingTotpReset] = useState(false);
  const failingError = update.error ?? remove.error ?? resetTotp.error;
  const failure: MemberEditorFailure | null =
    failingError === null
      ? null
      : (KNOWN_FAILURES.find((code) => failingError instanceof HttpError && failingError.code === code) ??
        'unexpected');

  return {
    failure,
    isBusy: update.isPending || remove.isPending || resetTotp.isPending,
    isConfirmingRemoval,
    isConfirmingTotpReset,
    changePermissions: (permissions: Permissions) => update.mutate({ memberId: member.id, body: { permissions } }),
    toggleOwner: () => update.mutate({ memberId: member.id, body: { owner: !member.owner } }),
    askToRemove: () => setConfirmingRemoval(true),
    cancelRemoval: () => setConfirmingRemoval(false),
    remove: () => remove.mutate(member.id),
    askToResetTotp: () => setConfirmingTotpReset(true),
    cancelTotpReset: () => setConfirmingTotpReset(false),
    resetTotp: () => resetTotp.mutate(member.id, { onSuccess: () => setConfirmingTotpReset(false) }),
  };
}
