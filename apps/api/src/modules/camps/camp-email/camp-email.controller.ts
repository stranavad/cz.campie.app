import { Controller } from '@nestjs/common';

import {
  listCampEmailTextsEndpoint,
  previewCampEmailTextEndpoint,
  resetCampEmailTextEndpoint,
  saveCampEmailTextEndpoint,
  type CampEmailText,
  type CampEmailTextBody,
  type CampEmailTextParams,
  type EmailPreview,
} from '@repo/schema/emails';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CampEmailService } from './services/camp-email.service.ts';

@Access('admin')
@Controller()
export class CampEmailController {
  constructor(private readonly campEmails: CampEmailService) {}

  @Endpoint(listCampEmailTextsEndpoint)
  @Requires('campSettings', 'read')
  public list(@EndpointParams(listCampEmailTextsEndpoint) { campId }: { campId: string }): Promise<CampEmailText[]> {
    return this.campEmails.list(campId);
  }

  @Endpoint(saveCampEmailTextEndpoint)
  @Requires('campSettings', 'write')
  public save(
    @RequestActor() actor: Actor,
    @EndpointParams(saveCampEmailTextEndpoint) { campId, type }: CampEmailTextParams,
    @EndpointBody(saveCampEmailTextEndpoint) body: CampEmailTextBody,
  ): Promise<CampEmailText> {
    return this.campEmails.save(actor, campId, type, body);
  }

  @Endpoint(resetCampEmailTextEndpoint)
  @Requires('campSettings', 'write')
  public reset(
    @RequestActor() actor: Actor,
    @EndpointParams(resetCampEmailTextEndpoint) { campId, type }: CampEmailTextParams,
  ): Promise<CampEmailText> {
    return this.campEmails.reset(actor, campId, type);
  }

  @Endpoint(previewCampEmailTextEndpoint)
  @Requires('campSettings', 'read')
  public preview(
    @EndpointParams(previewCampEmailTextEndpoint) { campId, type }: CampEmailTextParams,
    @EndpointBody(previewCampEmailTextEndpoint) body: Pick<CampEmailTextBody, 'subject' | 'text'>,
  ): Promise<EmailPreview> {
    return this.campEmails.preview(campId, type, body);
  }
}
