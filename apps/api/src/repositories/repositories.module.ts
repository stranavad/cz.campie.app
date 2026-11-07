import { Global, Module } from '@nestjs/common';

import { AdminRepository } from './admins/admin/admin.repository.ts';
import { InvitationRepository } from './admins/invitation/invitation.repository.ts';
import { MembershipRepository } from './admins/membership/membership.repository.ts';
import { PasswordResetRepository } from './admins/password-reset/password-reset.repository.ts';
import { TotpCredentialRepository } from './admins/totp-credential/totp-credential.repository.ts';
import { AuditEntryRepository } from './audit/audit-entry/audit-entry.repository.ts';
import { PlatformAuditEntryRepository } from './audit/platform-audit-entry/platform-audit-entry.repository.ts';
import { CampEmailTextRepository } from './camps/camp-email-text/camp-email-text.repository.ts';
import { CampRepository } from './camps/camp/camp.repository.ts';
import { DiscountCodeRepository } from './camps/discount-code/discount-code.repository.ts';
import { RegistrationFormRepository } from './camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from './camps/turnus/turnus.repository.ts';
import { FileRepository } from './files/file/file.repository.ts';
import { OperatorRepository } from './operators/operator/operator.repository.ts';
import { LegalAcceptanceRepository } from './organisations/legal-acceptance/legal-acceptance.repository.ts';
import { OrganisationKeyRepository } from './organisations/organisation-key/organisation-key.repository.ts';
import { OrganisationRepository } from './organisations/organisation/organisation.repository.ts';
import { AdminSessionRepository } from './sessions/admin-session/admin-session.repository.ts';
import { GuardianSessionRepository } from './sessions/guardian-session/guardian-session.repository.ts';

const REPOSITORIES = [
  OrganisationRepository,
  OrganisationKeyRepository,
  LegalAcceptanceRepository,
  AdminRepository,
  MembershipRepository,
  InvitationRepository,
  PasswordResetRepository,
  TotpCredentialRepository,
  OperatorRepository,
  AdminSessionRepository,
  GuardianSessionRepository,
  AuditEntryRepository,
  PlatformAuditEntryRepository,
  FileRepository,
  CampRepository,
  CampEmailTextRepository,
  TurnusRepository,
  DiscountCodeRepository,
  RegistrationFormRepository,
];

@Global()
@Module({
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class RepositoriesModule {}
