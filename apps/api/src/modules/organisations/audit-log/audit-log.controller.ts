import { Controller } from '@nestjs/common';

import { listAuditLogEndpoint, type AuditLogPage, type AuditLogQuery } from '@repo/schema/organisations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { Endpoint, EndpointQuery } from '../../../core/http/endpoint.decorator.ts';
import { AuditLogService } from './services/audit-log.service.ts';

@Access('admin')
@Requires('owner')
@Controller()
export class AuditLogController {
  constructor(private readonly log: AuditLogService) {}

  @Endpoint(listAuditLogEndpoint)
  public list(@EndpointQuery(listAuditLogEndpoint) query: AuditLogQuery): Promise<AuditLogPage> {
    return this.log.list(query);
  }
}
