import { Controller } from '@nestjs/common';

import {
  getPublicRegistrationFormEndpoint,
  type PublicCampParams,
  type RegistrationFormVersion,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { RegistrationFormService } from './services/registration-form.service.ts';

@Access('public')
@Controller()
export class PublicRegistrationFormController {
  constructor(private readonly forms: RegistrationFormService) {}

  @Endpoint(getPublicRegistrationFormEndpoint)
  public get(
    @EndpointParams(getPublicRegistrationFormEndpoint) { slug }: PublicCampParams,
  ): Promise<RegistrationFormVersion> {
    return this.forms.getPublic(slug);
  }
}
