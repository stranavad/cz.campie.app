import { Injectable } from '@nestjs/common';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UndeliverableEmailRepository } from '../../../../repositories/emails/undeliverable-email/undeliverable-email.repository.ts';

// The marks the mail provider's notifications leave on the current Organisation's addresses.
@Injectable()
export class UndeliverableEmailService {
  constructor(
    private readonly undeliverable: UndeliverableEmailRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Clear the mark of an address someone just gave or confirmed, audited; nothing when it had none.
   * @param actor who gave it
   * @param email the address, lowercase
   */
  public async clear(actor: Actor, email: string): Promise<void> {
    const id = await this.undeliverable.clear(email);

    if (id !== null) {
      await this.audit.record(actor, {
        action: 'undeliverable_email.clear',
        target: { type: 'undeliverable_email', id },
        change: { before: { email }, after: null },
      });
    }
  }
}
