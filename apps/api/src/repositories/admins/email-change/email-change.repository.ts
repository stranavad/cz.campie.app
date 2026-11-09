import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNotNull, isNull, lt } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { adminEmailChanges } from '../../../db/schema.ts';

export interface PendingAdminEmailChange {
  readonly id: string;
  readonly adminId: string;
  readonly email: string;
}

const pending = { id: adminEmailChanges.id, adminId: adminEmailChanges.adminId, email: adminEmailChanges.email };

@Injectable()
export class EmailChangeRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record an admin's new email waiting for confirmation, replacing any change of theirs still waiting, so
   * only the newest link works; a confirmed one keeps its row until its notice is sent.
   * @param adminId admin id
   * @param email the new email, lowercase
   * @param tokenHash SHA-256 of a token; the link's own is set when its email is sent
   * @param expiresAt when the link stops working
   * @throws {Error} when the database returns no row
   * @returns the change's id
   */
  public async replace(adminId: string, email: string, tokenHash: Buffer, expiresAt: Date): Promise<string> {
    await this.removeWaiting(adminId);

    const [row] = await this.unitOfWork.db
      .insert(adminEmailChanges)
      .values({ adminId, email, tokenHash, expiresAt })
      .returning({ id: adminEmailChanges.id });

    if (row === undefined) {
      throw new Error('The email change was not recorded');
    }

    return row.id;
  }

  /**
   * Remove an admin's change still waiting, so its link stops working.
   * @param adminId admin id
   */
  public async removeWaiting(adminId: string): Promise<void> {
    await this.unitOfWork.db
      .delete(adminEmailChanges)
      .where(and(eq(adminEmailChanges.adminId, adminId), isNull(adminEmailChanges.confirmedAt)));
  }

  /**
   * Give a waiting change the token its link carries.
   * @param id the change's id
   * @param tokenHash SHA-256 of the link's token
   * @returns the change, or null when it was confirmed or replaced meanwhile
   */
  public async issue(id: string, tokenHash: Buffer): Promise<PendingAdminEmailChange | null> {
    const [row] = await this.unitOfWork.db
      .update(adminEmailChanges)
      .set({ tokenHash })
      .where(and(eq(adminEmailChanges.id, id), isNull(adminEmailChanges.confirmedAt)))
      .returning(pending);

    return row ?? null;
  }

  /**
   * Confirm an unexpired, unconfirmed email change by its link's token, once: of two simultaneous calls
   * only one does.
   * @param tokenHash SHA-256 of the link's token
   * @param now the instant of use
   * @returns the change, or null when the link is unknown, used, replaced or expired
   */
  public async confirm(tokenHash: Buffer, now: Date): Promise<PendingAdminEmailChange | null> {
    const [row] = await this.unitOfWork.db
      .update(adminEmailChanges)
      .set({ confirmedAt: now })
      .where(
        and(
          eq(adminEmailChanges.tokenHash, tokenHash),
          isNull(adminEmailChanges.confirmedAt),
          gt(adminEmailChanges.expiresAt, now),
        ),
      )
      .returning(pending);

    return row ?? null;
  }

  /**
   * Keep the email a confirmed change replaced, for its notice.
   * @param id the change's id
   * @param previousEmail the admin's email before the change
   */
  public async keepPreviousEmail(id: string, previousEmail: string): Promise<void> {
    await this.unitOfWork.db.update(adminEmailChanges).set({ previousEmail }).where(eq(adminEmailChanges.id, id));
  }

  /**
   * Remove a confirmed change, once, for its notice.
   * @param id the change's id
   * @returns the email it replaced, or null when already taken
   */
  public async takePreviousEmail(id: string): Promise<string | null> {
    const [row] = await this.unitOfWork.db
      .delete(adminEmailChanges)
      .where(and(eq(adminEmailChanges.id, id), isNotNull(adminEmailChanges.confirmedAt)))
      .returning({ previousEmail: adminEmailChanges.previousEmail });

    return row?.previousEmail ?? null;
  }

  /**
   * Remove the email changes whose links expired before an instant.
   * @param before the instant
   * @returns how many were removed
   */
  public async removeExpired(before: Date): Promise<number> {
    const removed = await this.unitOfWork.db
      .delete(adminEmailChanges)
      .where(lt(adminEmailChanges.expiresAt, before))
      .returning({ id: adminEmailChanges.id });

    return removed.length;
  }
}
