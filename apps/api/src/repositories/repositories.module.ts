import { Global, Module } from '@nestjs/common';

import { AdminRepository } from './admins/admin/admin.repository.ts';
import { MembershipRepository } from './admins/membership/membership.repository.ts';
import { PasswordResetRepository } from './admins/password-reset/password-reset.repository.ts';
import { AuditEntryRepository } from './audit/audit-entry/audit-entry.repository.ts';
import { CampRepository } from './camps/camp/camp.repository.ts';
import { FileRepository } from './files/file/file.repository.ts';
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
  PasswordResetRepository,
  AdminSessionRepository,
  GuardianSessionRepository,
  AuditEntryRepository,
  FileRepository,
  CampRepository,
];

@Global()
@Module({
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class RepositoriesModule {}
