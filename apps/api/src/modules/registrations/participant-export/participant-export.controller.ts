import { Controller } from '@nestjs/common';

import {
  getParticipantExportEndpoint,
  startParticipantExportEndpoint,
  type ParticipantExport,
  type ParticipantExportParams,
  type ParticipantListParams,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor, RequestAdminId } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { ParticipantExportService } from './services/participant-export.service.ts';

@Access('admin')
@Requires('registrations', 'read')
@Controller()
export class ParticipantExportController {
  constructor(private readonly exports: ParticipantExportService) {}

  @Endpoint(startParticipantExportEndpoint)
  public start(
    @RequestActor() actor: Actor,
    @EndpointParams(startParticipantExportEndpoint) { turnusId }: ParticipantListParams,
  ): Promise<ParticipantExport> {
    return this.exports.start(actor, turnusId);
  }

  @Endpoint(getParticipantExportEndpoint)
  public get(
    @RequestAdminId() adminId: string,
    @EndpointParams(getParticipantExportEndpoint) { exportId }: ParticipantExportParams,
  ): Promise<ParticipantExport> {
    return this.exports.get(adminId, exportId);
  }
}
