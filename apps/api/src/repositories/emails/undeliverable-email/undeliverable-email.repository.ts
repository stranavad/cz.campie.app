import { Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';

import type { UndeliverableReason } from '@repo/schema/emails';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { undeliverableEmails } from '../../../db/schema.ts';

@Injectable()
export class UndeliverableEmailRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Mark an address of the current Organisation undeliverable, or record the latest reason of one marked.
   * @param email the address, lowercase
   * @param reason why
   * @param markedAt when the provider reported it
   * @returns the mark's id, and whether the address was marked before
   */
  public async mark(
    email: string,
    reason: UndeliverableReason,
    markedAt: Date,
  ): Promise<{ id: string; before: { reason: UndeliverableReason } | null }> {
    const [existing] = await this.unitOfWork.db
      .select({ id: undeliverableEmails.id, reason: undeliverableEmails.reason })
      .from(undeliverableEmails)
      .where(eq(undeliverableEmails.email, email))
      .for('update');

    const [row] = await this.unitOfWork.db
      .insert(undeliverableEmails)
      .values({ organisationId: this.unitOfWork.organisationId, email, reason, markedAt })
      .onConflictDoUpdate({
        target: [undeliverableEmails.organisationId, undeliverableEmails.email],
        set: { reason, markedAt },
      })
      .returning({ id: undeliverableEmails.id });

    return { id: row?.id ?? '', before: existing === undefined ? null : { reason: existing.reason } };
  }

  /**
   * Remove the mark of an address of the current Organisation, once someone vouched for it.
   * @param email the address, lowercase
   * @returns the removed mark's id, or null when it was not marked
   */
  public async clear(email: string): Promise<string | null> {
    const [row] = await this.unitOfWork.db
      .delete(undeliverableEmails)
      .where(eq(undeliverableEmails.email, email))
      .returning({ id: undeliverableEmails.id });

    return row?.id ?? null;
  }

  /**
   * Pick the marked ones of the current Organisation's addresses.
   * @param emails the addresses, lowercase
   */
  public async listMarked(emails: readonly string[]): Promise<Set<string>> {
    if (emails.length === 0) {
      return new Set();
    }

    const rows = await this.unitOfWork.db
      .select({ email: undeliverableEmails.email })
      .from(undeliverableEmails)
      .where(inArray(undeliverableEmails.email, [...new Set(emails)]));

    return new Set(rows.map(({ email }) => email));
  }
}
