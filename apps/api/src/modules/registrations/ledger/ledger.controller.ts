import { Controller } from '@nestjs/common';

import {
  addPriceAdjustmentEndpoint,
  getLedgerEndpoint,
  recordPaymentEndpoint,
  type AddPriceAdjustmentBody,
  type Ledger,
  type RecordPaymentBody,
  type RegistrationParams,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { LedgerService } from './services/ledger.service.ts';

@Access('admin')
@Controller()
export class LedgerController {
  constructor(private readonly ledgers: LedgerService) {}

  @Endpoint(getLedgerEndpoint)
  @Requires('registrations', 'read')
  public get(@EndpointParams(getLedgerEndpoint) { registrationId }: RegistrationParams): Promise<Ledger> {
    return this.ledgers.get(registrationId);
  }

  @Endpoint(recordPaymentEndpoint)
  @Requires('registrations', 'write')
  public recordPayment(
    @RequestActor() actor: Actor,
    @EndpointParams(recordPaymentEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(recordPaymentEndpoint) body: RecordPaymentBody,
  ): Promise<Ledger> {
    return this.ledgers.recordPayment(actor, registrationId, body);
  }

  @Endpoint(addPriceAdjustmentEndpoint)
  @Requires('registrations', 'write')
  public addPriceAdjustment(
    @RequestActor() actor: Actor,
    @EndpointParams(addPriceAdjustmentEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(addPriceAdjustmentEndpoint) body: AddPriceAdjustmentBody,
  ): Promise<Ledger> {
    return this.ledgers.addPriceAdjustment(actor, registrationId, body);
  }
}
