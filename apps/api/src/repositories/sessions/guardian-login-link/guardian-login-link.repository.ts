import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { guardianLoginLinks, guardianLoginRequests } from '../../../db/schema.ts';

@Injectable()
export class GuardianLoginLinkRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Create a login link of a guardian in the current Organisation; only its token's hash is stored.
   * @param input the guardian's email, the token's hash and the expiry
   */
  public async create(input: { email: string; tokenHash: Buffer; expiresAt: Date }): Promise<void> {
    await this.unitOfWork.db
      .insert(guardianLoginLinks)
      .values({ ...input, organisationId: this.unitOfWork.organisationId });
  }

  /**
   * Record a request for a login link in the current Organisation, for its job to look up.
   * @param email the email asked for, lowercase
   * @returns the request's id
   */
  public async createRequest(email: string): Promise<string> {
    const [row] = await this.unitOfWork.db
      .insert(guardianLoginRequests)
      .values({ email, organisationId: this.unitOfWork.organisationId })
      .returning({ id: guardianLoginRequests.id });

    if (row === undefined) {
      throw new Error('The login link request was not recorded');
    }

    return row.id;
  }

  /**
   * Remove a request for a login link of the current Organisation, once, so a retried job sends nothing new.
   * @param id the request's id
   * @returns its email, or null when it was already taken
   */
  public async takeRequest(id: string): Promise<string | null> {
    const [row] = await this.unitOfWork.db
      .delete(guardianLoginRequests)
      .where(eq(guardianLoginRequests.id, id))
      .returning({ email: guardianLoginRequests.email });

    return row?.email ?? null;
  }

  /**
   * Use up every unused login link of an email in the current Organisation, once one has signed it in.
   * @param email the guardian's email
   * @param now the instant of use
   */
  public async consumeAllOf(email: string, now: Date): Promise<void> {
    await this.unitOfWork.db
      .update(guardianLoginLinks)
      .set({ usedAt: now })
      .where(and(eq(guardianLoginLinks.email, email), isNull(guardianLoginLinks.usedAt)));
  }

  /**
   * Use up an unused, unexpired login link of the current Organisation, in one step, so two uses of one
   * link never both succeed.
   * @param tokenHash SHA-256 of the link's token
   * @param now the instant of use
   * @returns the link's id and guardian's email, or null when the link is unknown, used or expired
   */
  public async consume(tokenHash: Buffer, now: Date): Promise<{ id: string; email: string } | null> {
    const [row] = await this.unitOfWork.db
      .update(guardianLoginLinks)
      .set({ usedAt: now })
      .where(
        and(
          eq(guardianLoginLinks.tokenHash, tokenHash),
          isNull(guardianLoginLinks.usedAt),
          gt(guardianLoginLinks.expiresAt, now),
        ),
      )
      .returning({ id: guardianLoginLinks.id, email: guardianLoginLinks.email });

    return row ?? null;
  }
}
