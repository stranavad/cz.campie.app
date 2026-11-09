import { Controller } from '@nestjs/common';

import {
  getPublicCampEndpoint,
  listPublicCampsEndpoint,
  listPublicTurnusyEndpoint,
  type PublicCamp,
  type PublicCampCard,
  type PublicCampParams,
  type PublicTurnus,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CampService } from './services/camp.service.ts';

@Access('public')
@Controller()
export class PublicCampController {
  constructor(private readonly camps: CampService) {}

  @Endpoint(getPublicCampEndpoint)
  public get(@EndpointParams(getPublicCampEndpoint) { slug }: PublicCampParams): Promise<PublicCamp> {
    return this.camps.getPublic(slug);
  }

  @Endpoint(listPublicCampsEndpoint)
  public list(): Promise<PublicCampCard[]> {
    return this.camps.listPublic();
  }

  @Endpoint(listPublicTurnusyEndpoint)
  public turnusy(@EndpointParams(listPublicTurnusyEndpoint) { slug }: PublicCampParams): Promise<PublicTurnus[]> {
    return this.camps.listPublicTurnusy(slug);
  }
}
