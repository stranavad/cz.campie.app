import { Controller } from '@nestjs/common';

import {
  getSelectedTurnusEndpoint,
  getTurnusOverviewEndpoint,
  listParticipantsEndpoint,
  setSelectedTurnusEndpoint,
  type ParticipantListParams,
  type ParticipantListQuery,
  type ParticipantRow,
  type SelectedTurnus,
  type SetSelectedTurnusBody,
  type TurnusOverview,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestAdminId } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint, EndpointBody, EndpointParams, EndpointQuery } from '../../../core/http/endpoint.decorator.ts';
import { ParticipantListService } from './services/participant-list.service.ts';

@Access('admin')
@Requires('registrations', 'read')
@Controller()
export class ParticipantListController {
  constructor(private readonly lists: ParticipantListService) {}

  @Endpoint(getSelectedTurnusEndpoint)
  public getSelected(@RequestAdminId() adminId: string): Promise<SelectedTurnus> {
    return this.lists.getSelected(adminId);
  }

  @Endpoint(setSelectedTurnusEndpoint)
  public select(
    @RequestAdminId() adminId: string,
    @EndpointBody(setSelectedTurnusEndpoint) { turnusId }: SetSelectedTurnusBody,
  ): Promise<SelectedTurnus> {
    return this.lists.select(adminId, turnusId);
  }

  @Endpoint(listParticipantsEndpoint)
  public list(
    @EndpointParams(listParticipantsEndpoint) { turnusId }: ParticipantListParams,
    @EndpointQuery(listParticipantsEndpoint) query: ParticipantListQuery,
  ): Promise<ParticipantRow[]> {
    return this.lists.list(turnusId, query);
  }

  @Endpoint(getTurnusOverviewEndpoint)
  public overview(
    @EndpointParams(getTurnusOverviewEndpoint) { turnusId }: ParticipantListParams,
  ): Promise<TurnusOverview> {
    return this.lists.overview(turnusId);
  }
}
