import { Injectable } from '@nestjs/common';

import { EncryptionService } from '../../../../core/encryption/encryption.service.ts';
import type { OrganisationEntity } from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';

@Injectable()
export class OrganisationService {
  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Create an Organisation with its data key, in the current platform unit of work.
   */
  public async create(): Promise<OrganisationEntity> {
    const organisation = await this.organisations.create();

    await this.encryption.createDataKey(organisation.id);

    return organisation;
  }
}
