import { Module, type DynamicModule } from '@nestjs/common';

import { AccessModule } from './core/access/access.module.ts';
import { AuditModule } from './core/audit/audit.module.ts';
import { appConfigModule } from './core/config/config.module.ts';
import { DatabaseModule } from './core/database/database.module.ts';
import { DocumentsModule } from './core/documents/documents.module.ts';
import { EmailsModule } from './core/emails/emails.module.ts';
import { EncryptionModule } from './core/encryption/encryption.module.ts';
import { FilesModule } from './core/files/files.module.ts';
import { HealthModule } from './core/health/health.module.ts';
import { JobsModule } from './core/jobs/jobs.module.ts';
import { ClockModule } from './core/ports/clock/clock.module.ts';
import { FileStorageModule } from './core/ports/file-storage/file-storage.module.ts';
import { KeyProviderModule } from './core/ports/key-provider/key-provider.module.ts';
import { MailSenderModule } from './core/ports/mail-sender/mail-sender.module.ts';
import { PaymentGatewayModule } from './core/ports/payment-gateway/payment-gateway.module.ts';
import { PdfRendererModule } from './core/ports/pdf-renderer/pdf-renderer.module.ts';
import { RateLimitsModule } from './core/rate-limits/rate-limits.module.ts';
import { SessionsModule } from './core/sessions/sessions.module.ts';
import { AdminsModule } from './modules/admins/admins.module.ts';
import { CampsModule } from './modules/camps/camps.module.ts';
import { ConsoleModule } from './modules/console/console.module.ts';
import { OrganisationsModule } from './modules/organisations/organisations.module.ts';
import { RegistrationsModule } from './modules/registrations/registrations.module.ts';
import { RepositoriesModule } from './repositories/repositories.module.ts';

@Module({})
export class AppModule {
  // Built per start, so the configuration is read from the environment of that start, not when
  // this file is first imported.
  public static forRoot(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        appConfigModule(),
        DatabaseModule,
        ClockModule,
        MailSenderModule,
        FileStorageModule,
        PdfRendererModule,
        PaymentGatewayModule,
        KeyProviderModule,
        RepositoriesModule,
        EncryptionModule,
        AuditModule,
        SessionsModule,
        AccessModule,
        JobsModule,
        RateLimitsModule,
        FilesModule,
        DocumentsModule,
        EmailsModule,
        HealthModule,
        OrganisationsModule,
        AdminsModule,
        CampsModule,
        RegistrationsModule,
        ConsoleModule,
      ],
    };
  }
}
