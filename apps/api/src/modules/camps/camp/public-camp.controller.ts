import { Controller } from '@nestjs/common';

import { getPublicCampEndpoint, type PublicCamp, type PublicCampParams } from '@repo/schema/camps';

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
}
