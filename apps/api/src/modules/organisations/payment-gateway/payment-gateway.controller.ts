import { Controller } from '@nestjs/common';

import {
  getPaymentGatewaySettingsEndpoint,
  removePaymentGatewayKeysEndpoint,
  setPaymentGatewayKeysEndpoint,
  type PaymentGatewaySettings,
  type SetPaymentGatewayKeysBody,
} from '@repo/schema/organisations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { PaymentGatewayService } from './services/payment-gateway.service.ts';

@Access('admin')
@Requires('owner')
@Controller()
export class PaymentGatewayController {
  constructor(private readonly gateway: PaymentGatewayService) {}

  @Endpoint(getPaymentGatewaySettingsEndpoint)
  public async get(): Promise<PaymentGatewaySettings> {
    return this.gateway.get();
  }

  @Endpoint(setPaymentGatewayKeysEndpoint)
  public async setKeys(
    @RequestActor() actor: Actor,
    @EndpointBody(setPaymentGatewayKeysEndpoint) body: SetPaymentGatewayKeysBody,
  ): Promise<PaymentGatewaySettings> {
    return this.gateway.setKeys(actor, body);
  }

  @Endpoint(removePaymentGatewayKeysEndpoint)
  public async removeKeys(@RequestActor() actor: Actor): Promise<PaymentGatewaySettings> {
    return this.gateway.removeKeys(actor);
  }
}
