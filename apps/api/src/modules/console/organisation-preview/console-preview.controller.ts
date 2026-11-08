import { Controller } from '@nestjs/common';

import { previewOrganisationEndpoint, type OrganisationPreview } from '@repo/schema/console';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint } from '../../../core/http/endpoint.decorator.ts';
import { CampService } from '../../camps/camp/services/camp.service.ts';

// Runs in the previewed Organisation's unit of work: only its public pages' data may leave it here.
@Access('operator-preview')
@Controller()
export class ConsolePreviewController {
  constructor(private readonly camps: CampService) {}

  @Endpoint(previewOrganisationEndpoint)
  public async preview(): Promise<OrganisationPreview> {
    return { camps: await this.camps.previewAll() };
  }
}
