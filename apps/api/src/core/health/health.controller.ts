import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Access } from '../access/access.decorator.ts';
import { HealthService, type HealthReport } from './health.service.ts';

// Infrastructure route for container and uptime checks, not a contract the app calls.
@Access('unscoped')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  public async check(@Res({ passthrough: true }) response: Response): Promise<HealthReport> {
    const report = await this.healthService.check();

    response.status(report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return report;
  }
}
