import { useState } from 'react';

import type { Member, Permissions } from '@repo/schema/admins';

import { useRemoveMemberMutation, useUpdateMemberMutation } from '@/features/members/api/members.queries';
import { HttpError } from '@/lib/api';

export type MemberRowFailure = 'last_owner' | 'unexpected';

export function useMemberRow(organisationId: string, member: Member) {
  const update = useUpdateMemberMutation(organisationId);
  const remove = useRemoveMemberMutation(organisationId);
  const [isConfirmingRemoval, setConfirmingRemoval] = useState(false);
  const failingError = update.error ?? remove.error;
  const failure: MemberRowFailure | null =
    failingError === null
      ? null
      : failingError instanceof HttpError && failingError.code === 'last_owner'
        ? 'last_owner'
        : 'unexpected';

  return {
    failure,
    isBusy: update.isPending || remove.isPending,
    isConfirmingRemoval,
    changePermissions: (permissions: Permissions) => update.mutate({ memberId: member.id, body: { permissions } }),
    toggleOwner: () => update.mutate({ memberId: member.id, body: { owner: !member.owner } }),
    askToRemove: () => setConfirmingRemoval(true),
    cancelRemoval: () => setConfirmingRemoval(false),
    remove: () => remove.mutate(member.id),
  };
}
