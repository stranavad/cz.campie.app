import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateInvitationBody, UpdateMemberBody } from '@repo/schema/admins';

import { accountKeys } from '@/core/account';
import { membersKeys } from '@/features/members/api/members.keys';
import { membersService } from '@/features/members/api/members.service';

export const membersQueryOptions = (organisationId: string) =>
  queryOptions({
    queryKey: membersKeys.list(organisationId),
    queryFn: ({ signal }) => membersService.list(organisationId, signal),
  });

export const invitationsQueryOptions = (organisationId: string) =>
  queryOptions({
    queryKey: membersKeys.invitations(organisationId),
    queryFn: ({ signal }) => membersService.listInvitations(organisationId, signal),
  });

// Disabled until the admin is known to be an Owner of the Organisation, since anyone else is refused.
export const useMembersQuery = (organisationId: string, enabled: boolean) =>
  useQuery({ ...membersQueryOptions(organisationId), enabled });

export const useInvitationsQuery = (organisationId: string, enabled: boolean) =>
  useQuery({ ...invitationsQueryOptions(organisationId), enabled });

// A change can be the admin's own, such as stepping down as Owner, so their account is refetched too.
export const useUpdateMemberMutation = (organisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, body }: { memberId: string; body: UpdateMemberBody }) =>
      membersService.update(organisationId, memberId, body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: membersKeys.list(organisationId) }),
        queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      ]),
  });
};

export const useRemoveMemberMutation = (organisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => membersService.remove(organisationId, memberId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: membersKeys.list(organisationId) }),
        queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      ]),
  });
};

export const useInviteMutation = (organisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateInvitationBody) => membersService.invite(organisationId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersKeys.invitations(organisationId) }),
  });
};

export const useRevokeInvitationMutation = (organisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => membersService.revokeInvitation(organisationId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersKeys.invitations(organisationId) }),
  });
};
