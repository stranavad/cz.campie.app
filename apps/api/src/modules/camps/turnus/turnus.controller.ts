import { Controller } from '@nestjs/common';

import {
  createTurnusEndpoint,
  getTurnusEndpoint,
  listTurnusyEndpoint,
  removeTurnusEndpoint,
  updateTurnusEndpoint,
  type CampParams,
  type Turnus,
  type TurnusBody,
  type TurnusParams,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { TurnusService } from './services/turnus.service.ts';

@Access('admin')
@Controller()
export class TurnusController {
  constructor(private readonly turnusy: TurnusService) {}

  @Endpoint(listTurnusyEndpoint)
  @Requires('campSettings', 'read')
  public list(@EndpointParams(listTurnusyEndpoint) { campId }: CampParams): Promise<Turnus[]> {
    return this.turnusy.listByCamp(campId);
  }

  @Endpoint(getTurnusEndpoint)
  @Requires('campSettings', 'read')
  public get(@EndpointParams(getTurnusEndpoint) { turnusId }: TurnusParams): Promise<Turnus> {
    return this.turnusy.get(turnusId);
  }

  @Endpoint(createTurnusEndpoint)
  @Requires('campSettings', 'write')
  public create(
    @RequestActor() actor: Actor,
    @EndpointParams(createTurnusEndpoint) { campId }: CampParams,
    @EndpointBody(createTurnusEndpoint) body: TurnusBody,
  ): Promise<Turnus> {
    return this.turnusy.create(actor, campId, body);
  }

  @Endpoint(updateTurnusEndpoint)
  @Requires('campSettings', 'write')
  public update(
    @RequestActor() actor: Actor,
    @EndpointParams(updateTurnusEndpoint) { turnusId }: TurnusParams,
    @EndpointBody(updateTurnusEndpoint) body: TurnusBody,
  ): Promise<Turnus> {
    return this.turnusy.update(actor, turnusId, body);
  }

  @Endpoint(removeTurnusEndpoint)
  @Requires('campSettings', 'write')
  public remove(
    @RequestActor() actor: Actor,
    @EndpointParams(removeTurnusEndpoint) { turnusId }: TurnusParams,
  ): Promise<void> {
    return this.turnusy.remove(actor, turnusId);
  }
}
