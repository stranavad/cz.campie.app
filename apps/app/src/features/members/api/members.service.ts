import {
  createInvitationEndpoint,
  listInvitationsEndpoint,
  listMembersEndpoint,
  removeMemberEndpoint,
  resetMemberTotpEndpoint,
  revokeInvitationEndpoint,
  updateMemberEndpoint,
  type CreateInvitationBody,
  type UpdateMemberBody,
} from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const membersService = {
  list: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listMembersEndpoint, { organisationId, signal }),
  update: (organisationId: string, memberId: string, body: UpdateMemberBody) =>
    apiClient.request(updateMemberEndpoint, { organisationId, params: { memberId }, body }),
  remove: (organisationId: string, memberId: string) =>
    apiClient.request(removeMemberEndpoint, { organisationId, params: { memberId } }),
  resetTotp: (organisationId: string, memberId: string) =>
    apiClient.request(resetMemberTotpEndpoint, { organisationId, params: { memberId } }),
  listInvitations: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listInvitationsEndpoint, { organisationId, signal }),
  invite: (organisationId: string, body: CreateInvitationBody) =>
    apiClient.request(createInvitationEndpoint, { organisationId, body }),
  revokeInvitation: (organisationId: string, invitationId: string) =>
    apiClient.request(revokeInvitationEndpoint, { organisationId, params: { invitationId } }),
};
