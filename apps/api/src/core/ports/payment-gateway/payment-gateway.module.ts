import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { ComgatePaymentGateway } from './comgate-payment-gateway.adapter.ts';
import { FakePaymentGateway } from './fake-payment-gateway.adapter.ts';
import { PaymentGateway } from './payment-gateway.port.ts';

@Global()
@Module({
  providers: [
    {
      provide: PaymentGateway,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): PaymentGateway =>
        config.get('paymentGateway', { infer: true }).adapter === 'comgate'
          ? new ComgatePaymentGateway()
          : new FakePaymentGateway(),
    },
  ],
  exports: [PaymentGateway],
})
export class PaymentGatewayModule {}
