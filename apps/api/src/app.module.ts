import { Module, type DynamicModule } from '@nestjs/common';

import { appConfigModule } from './core/config/config.module.ts';
import { HealthModule } from './core/health/health.module.ts';
import { ClockModule } from './core/ports/clock/clock.module.ts';
import { FileStorageModule } from './core/ports/file-storage/file-storage.module.ts';
import { KeyProviderModule } from './core/ports/key-provider/key-provider.module.ts';
import { MailSenderModule } from './core/ports/mail-sender/mail-sender.module.ts';
import { PaymentGatewayModule } from './core/ports/payment-gateway/payment-gateway.module.ts';
import { PdfRendererModule } from './core/ports/pdf-renderer/pdf-renderer.module.ts';

@Module({})
export class AppModule {
  // Built per start, so the configuration is read from the environment of that start, not when
  // this file is first imported.
  public static forRoot(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        appConfigModule(),
        ClockModule,
        MailSenderModule,
        FileStorageModule,
        PdfRendererModule,
        PaymentGatewayModule,
        KeyProviderModule,
        HealthModule,
      ],
    };
  }
}
