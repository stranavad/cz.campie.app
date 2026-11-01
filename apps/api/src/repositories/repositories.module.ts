import { Global, Module } from '@nestjs/common';

import { AdminRepository } from './admins/admin/admin.repository.ts';
import { MembershipRepository } from './admins/membership/membership.repository.ts';
import { AuditEntryRepository } from './audit/audit-entry/audit-entry.repository.ts';
import { FileRepository } from './files/file/file.repository.ts';
import { OrganisationKeyRepository } from './organisations/organisation-key/organisation-key.repository.ts';
import { OrganisationRepository } from './organisations/organisation/organisation.repository.ts';
import { AdminSessionRepository } from './sessions/admin-session/admin-session.repository.ts';
import { GuardianSessionRepository } from './sessions/guardian-session/guardian-session.repository.ts';

const REPOSITORIES = [
  OrganisationRepository,
  OrganisationKeyRepository,
  AdminRepository,
  MembershipRepository,
  AdminSessionRepository,
  GuardianSessionRepository,
  AuditEntryRepository,
  FileRepository,
];

@Global()
@Module({
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class RepositoriesModule {}
