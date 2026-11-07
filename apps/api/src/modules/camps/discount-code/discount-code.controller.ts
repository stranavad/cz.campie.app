import { Controller } from '@nestjs/common';

import {
  createDiscountCodeEndpoint,
  listDiscountCodesEndpoint,
  removeDiscountCodeEndpoint,
  updateDiscountCodeEndpoint,
  type CampParams,
  type CreateDiscountCodeBody,
  type DiscountCodeParams,
  type DiscountCodeResource,
  type UpdateDiscountCodeBody,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { DiscountCodeService } from './services/discount-code.service.ts';

@Access('admin')
@Controller()
export class DiscountCodeController {
  constructor(private readonly discountCodes: DiscountCodeService) {}

  @Endpoint(listDiscountCodesEndpoint)
  @Requires('campSettings', 'read')
  public list(@EndpointParams(listDiscountCodesEndpoint) { campId }: CampParams): Promise<DiscountCodeResource[]> {
    return this.discountCodes.listByCamp(campId);
  }

  @Endpoint(createDiscountCodeEndpoint)
  @Requires('campSettings', 'write')
  public create(
    @RequestActor() actor: Actor,
    @EndpointParams(createDiscountCodeEndpoint) { campId }: CampParams,
    @EndpointBody(createDiscountCodeEndpoint) body: CreateDiscountCodeBody,
  ): Promise<DiscountCodeResource> {
    return this.discountCodes.create(actor, campId, body);
  }

  @Endpoint(updateDiscountCodeEndpoint)
  @Requires('campSettings', 'write')
  public update(
    @RequestActor() actor: Actor,
    @EndpointParams(updateDiscountCodeEndpoint) { discountCodeId }: DiscountCodeParams,
    @EndpointBody(updateDiscountCodeEndpoint) body: UpdateDiscountCodeBody,
  ): Promise<DiscountCodeResource> {
    return this.discountCodes.update(actor, discountCodeId, body);
  }

  @Endpoint(removeDiscountCodeEndpoint)
  @Requires('campSettings', 'write')
  public remove(
    @RequestActor() actor: Actor,
    @EndpointParams(removeDiscountCodeEndpoint) { discountCodeId }: DiscountCodeParams,
  ): Promise<void> {
    return this.discountCodes.remove(actor, discountCodeId);
  }
}
