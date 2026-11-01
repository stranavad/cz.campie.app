import { Global, Module } from '@nestjs/common';

import { AuditEntryRepository } from './audit/audit-entry/audit-entry.repository.ts';
import { FileRepository } from './files/file/file.repository.ts';
import { OrganisationKeyRepository } from './organisations/organisation-key/organisation-key.repository.ts';
import { OrganisationRepository } from './organisations/organisation/organisation.repository.ts';

const REPOSITORIES = [OrganisationRepository, OrganisationKeyRepository, AuditEntryRepository, FileRepository];

@Global()
@Module({
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class RepositoriesModule {}
