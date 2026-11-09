import { listCampsEndpoint, listTurnusyEndpoint } from '@repo/schema/camps';
import { listParticipantsEndpoint } from '@repo/schema/registrations';

import { apiClient } from '@/lib/api';

export const adminHomeService = {
  participants: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(listParticipantsEndpoint, { organisationId, params: { turnusId }, query: {}, signal }),
  camps: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listCampsEndpoint, { organisationId, signal }),
  turnusy: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(listTurnusyEndpoint, { organisationId, params: { campId }, signal }),
};
