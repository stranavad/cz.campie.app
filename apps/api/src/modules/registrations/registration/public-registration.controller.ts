import { Controller, Ip } from '@nestjs/common';

import type { PublicCampParams } from '@repo/schema/camps';
import {
  submitRegistrationEndpoint,
  type SubmitRegistrationBody,
  type SubmittedRegistration,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { RegistrationService } from './services/registration.service.ts';

@Access('public')
@Controller()
export class PublicRegistrationController {
  constructor(private readonly registrations: RegistrationService) {}

  @Endpoint(submitRegistrationEndpoint)
  public submit(
    @EndpointParams(submitRegistrationEndpoint) { slug }: PublicCampParams,
    @EndpointBody(submitRegistrationEndpoint) body: SubmitRegistrationBody,
    @Ip() ipAddress: string,
  ): Promise<SubmittedRegistration> {
    return this.registrations.submit(slug, body, ipAddress);
  }
}
