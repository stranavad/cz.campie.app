import { Controller } from '@nestjs/common';

import {
  createCampEndpoint,
  getCampEndpoint,
  listCampsEndpoint,
  previewCampEndpoint,
  updateCampEndpoint,
  type Camp,
  type CampParams,
  type CampPreview,
  type CampSummary,
  type CreateCampBody,
  type UpdateCampBody,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CampService } from './services/camp.service.ts';

@Access('admin')
@Controller()
export class CampController {
  constructor(private readonly camps: CampService) {}

  // Every admin picks among the Camps, whatever their areas.
  @Endpoint(listCampsEndpoint)
  @Requires('member')
  public async list(): Promise<CampSummary[]> {
    return (await this.camps.list()).map((camp) => camp.toSummaryDto());
  }

  @Endpoint(getCampEndpoint)
  @Requires('campSettings', 'read')
  public async get(@EndpointParams(getCampEndpoint) { campId }: CampParams): Promise<Camp> {
    return (await this.camps.getByIdOrThrow(campId)).toDto();
  }

  @Endpoint(createCampEndpoint)
  @Requires('campSettings', 'write')
  public async create(
    @RequestActor() actor: Actor,
    @EndpointBody(createCampEndpoint) body: CreateCampBody,
  ): Promise<Camp> {
    return (await this.camps.create(actor, body)).toDto();
  }

  @Endpoint(updateCampEndpoint)
  @Requires('campSettings', 'write')
  public async update(
    @RequestActor() actor: Actor,
    @EndpointParams(updateCampEndpoint) { campId }: CampParams,
    @EndpointBody(updateCampEndpoint) body: UpdateCampBody,
  ): Promise<Camp> {
    return (await this.camps.update(actor, campId, body)).toDto();
  }

  // Every admin of the Organisation sees what guardians will.
  @Endpoint(previewCampEndpoint)
  @Requires('member')
  public preview(@EndpointParams(previewCampEndpoint) { campId }: CampParams): Promise<CampPreview> {
    return this.camps.preview(campId);
  }
}
