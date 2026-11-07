import { Controller, HttpCode, HttpStatus, Post, Req, type RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { Access } from '../../../core/access/access.decorator.ts';
import { MailNotificationService } from './services/mail-notification.service.ts';

// The mail provider's webhook, not a contract the app calls: its signature covers the body byte for byte,
// so the route reads the raw body rather than a parsed one.
@Access('webhook')
@Controller('webhooks')
export class MailNotificationController {
  constructor(private readonly notifications: MailNotificationService) {}

  @Post('mail')
  @HttpCode(HttpStatus.NO_CONTENT)
  public receive(@Req() request: RawBodyRequest<Request>): Promise<void> {
    return this.notifications.receive({ body: request.rawBody ?? Buffer.alloc(0), headers: request.headers });
  }
}
