import { Controller } from '@nestjs/common';

import { getPublicOrganisationEndpoint, type PublicOrganisation } from '@repo/schema/organisations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint } from '../../../core/http/endpoint.decorator.ts';
import { OrganisationService } from './services/organisation.service.ts';

@Access('public')
@Controller()
export class PublicOrganisationController {
  constructor(private readonly organisations: OrganisationService) {}

  @Endpoint(getPublicOrganisationEndpoint)
  public async get(): Promise<PublicOrganisation> {
    return (await this.organisations.getCurrent()).toPublicDto();
  }
}
