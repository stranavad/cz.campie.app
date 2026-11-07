import { Controller } from '@nestjs/common';

import { eraseRegistrationEndpoint, type RegistrationParams } from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { ErasureService } from './services/erasure.service.ts';

@Access('admin')
@Requires('owner')
@Controller()
export class ErasureController {
  constructor(private readonly erasure: ErasureService) {}

  @Endpoint(eraseRegistrationEndpoint)
  public erase(
    @RequestActor() actor: Actor,
    @EndpointParams(eraseRegistrationEndpoint) { registrationId }: RegistrationParams,
  ): Promise<void> {
    return this.erasure.erase(actor, registrationId);
  }
}
