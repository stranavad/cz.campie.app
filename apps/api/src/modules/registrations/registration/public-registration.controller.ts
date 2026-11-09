import { Controller, Ip } from '@nestjs/common';

import type { PublicCampParams } from '@repo/schema/camps';
import {
  getSubmittedPrihlaskyEndpoint,
  submitRegistrationEndpoint,
  type GetSubmittedPrihlaskyBody,
  type SubmitRegistrationBody,
  type SubmittedPrihlasky,
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

  @Endpoint(getSubmittedPrihlaskyEndpoint)
  public prihlasky(
    @EndpointParams(getSubmittedPrihlaskyEndpoint) { slug }: PublicCampParams,
    @EndpointBody(getSubmittedPrihlaskyEndpoint) body: GetSubmittedPrihlaskyBody,
    @Ip() ipAddress: string,
  ): Promise<SubmittedPrihlasky> {
    return this.registrations.submittedPrihlasky(slug, body, ipAddress);
  }
}
