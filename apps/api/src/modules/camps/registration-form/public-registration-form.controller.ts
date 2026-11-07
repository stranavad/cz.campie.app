import { Controller, Ip } from '@nestjs/common';

import {
  getPublicRegistrationFormEndpoint,
  previewPriceEndpoint,
  type PreviewPriceBody,
  type PreviewPriceResponse,
  type PublicCampParams,
  type RegistrationFormVersion,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { PricePreviewService } from './services/price-preview.service.ts';
import { RegistrationFormService } from './services/registration-form.service.ts';

@Access('public')
@Controller()
export class PublicRegistrationFormController {
  constructor(
    private readonly forms: RegistrationFormService,
    private readonly prices: PricePreviewService,
  ) {}

  @Endpoint(getPublicRegistrationFormEndpoint)
  public get(
    @EndpointParams(getPublicRegistrationFormEndpoint) { slug }: PublicCampParams,
  ): Promise<RegistrationFormVersion> {
    return this.forms.getPublic(slug);
  }

  @Endpoint(previewPriceEndpoint)
  public previewPrice(
    @EndpointParams(previewPriceEndpoint) { slug }: PublicCampParams,
    @EndpointBody(previewPriceEndpoint) body: PreviewPriceBody,
    @Ip() ipAddress: string,
  ): Promise<PreviewPriceResponse> {
    return this.prices.preview(slug, body, ipAddress);
  }
}
