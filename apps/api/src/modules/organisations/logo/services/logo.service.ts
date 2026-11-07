import { Injectable, NotFoundException } from '@nestjs/common';

import type { FileContentType } from '@repo/schema/files';

import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';

@Injectable()
export class LogoService {
  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly camps: CampRepository,
    private readonly files: FileService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Read the logo of the current Organisation or of one of its Camps, for their public pages. Any other
   * file of the Organisation is not found, however its id was learned.
   * @param fileId the logo's file id
   * @throws {NotFoundException} when the file is no current logo of the Organisation or its Camps
   */
  public async readPublic(fileId: string): Promise<{ contentType: FileContentType; bytes: Buffer }> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    if (organisation.logoFileId !== fileId && !(await this.camps.hasLogo(fileId))) {
      throw new NotFoundException();
    }

    const { contentType, bytes } = await this.files.read(fileId);

    return { contentType, bytes };
  }
}
