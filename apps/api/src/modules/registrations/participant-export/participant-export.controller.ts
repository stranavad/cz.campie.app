import { Controller } from '@nestjs/common';

import {
  getExportOptionsEndpoint,
  getParticipantExportEndpoint,
  removeExportPresetEndpoint,
  saveExportPresetEndpoint,
  startParticipantExportEndpoint,
  startPaymentsExportEndpoint,
  type CampExportPresetsParams,
  type ExportOptions,
  type ExportPreset,
  type ExportPresetParams,
  type ParticipantExport,
  type ParticipantExportParams,
  type ParticipantListParams,
  type SaveExportPresetBody,
  type StartParticipantExportBody,
  type StartPaymentsExportBody,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor, RequestAdminId } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { ParticipantExportService } from './services/participant-export.service.ts';

@Access('admin')
@Requires('registrations', 'read')
@Controller()
export class ParticipantExportController {
  constructor(private readonly exports: ParticipantExportService) {}

  @Endpoint(getExportOptionsEndpoint)
  public options(
    @RequestAdminId() adminId: string,
    @EndpointParams(getExportOptionsEndpoint) { turnusId }: ParticipantListParams,
  ): Promise<ExportOptions> {
    return this.exports.options(adminId, turnusId);
  }

  @Endpoint(startParticipantExportEndpoint)
  public start(
    @RequestActor() actor: Actor,
    @EndpointParams(startParticipantExportEndpoint) { turnusId }: ParticipantListParams,
    @EndpointBody(startParticipantExportEndpoint) body: StartParticipantExportBody,
  ): Promise<ParticipantExport> {
    return this.exports.start(actor, turnusId, body);
  }

  @Endpoint(startPaymentsExportEndpoint)
  public startPayments(
    @RequestActor() actor: Actor,
    @EndpointBody(startPaymentsExportEndpoint) body: StartPaymentsExportBody,
  ): Promise<ParticipantExport> {
    return this.exports.startPayments(actor, body);
  }

  @Endpoint(saveExportPresetEndpoint)
  public savePreset(
    @RequestActor() actor: Actor,
    @EndpointParams(saveExportPresetEndpoint) { campId }: CampExportPresetsParams,
    @EndpointBody(saveExportPresetEndpoint) body: SaveExportPresetBody,
  ): Promise<ExportPreset> {
    return this.exports.savePreset(actor, campId, body);
  }

  @Endpoint(removeExportPresetEndpoint)
  public removePreset(
    @RequestActor() actor: Actor,
    @EndpointParams(removeExportPresetEndpoint) { presetId }: ExportPresetParams,
  ): Promise<void> {
    return this.exports.removePreset(actor, presetId);
  }

  @Endpoint(getParticipantExportEndpoint)
  public get(
    @RequestAdminId() adminId: string,
    @EndpointParams(getParticipantExportEndpoint) { exportId }: ParticipantExportParams,
  ): Promise<ParticipantExport> {
    return this.exports.get(adminId, exportId);
  }
}
