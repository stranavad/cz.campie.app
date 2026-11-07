import { Controller } from '@nestjs/common';

import {
  getGuardianChecklistEndpoint,
  type GuardianChecklist,
  type GuardianChecklistParams,
} from '@repo/schema/checklist';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { ChecklistService } from './services/checklist.service.ts';

@Access('guardian')
@Controller()
export class GuardianChecklistController {
  constructor(private readonly checklists: ChecklistService) {}

  @Endpoint(getGuardianChecklistEndpoint)
  public get(
    @RequestGuardianEmail() email: string,
    @EndpointParams(getGuardianChecklistEndpoint) { registrationId }: GuardianChecklistParams,
  ): Promise<GuardianChecklist> {
    return this.checklists.forGuardian(email, registrationId);
  }
}
