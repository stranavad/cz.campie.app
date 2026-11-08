import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNotNull, isNull, lt } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { guardianEmailChanges } from '../../../db/schema.ts';

export interface PendingEmailChange {
  readonly id: string;
  readonly registrationId: string;
  readonly position: number;
  readonly email: string;
}

const pending = {
  id: guardianEmailChanges.id,
  registrationId: guardianEmailChanges.registrationId,
  position: guardianEmailChanges.position,
  email: guardianEmailChanges.email,
};

@Injectable()
export class GuardianEmailChangeRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record a guardian's new email waiting for confirmation, replacing any change of that guardian still
   * waiting; a confirmed one keeps its row until its notice is sent.
   * @param change the Registration, the guardian's position and the new email
   * @param tokenHash SHA-256 of a token; the link's own is set when its email is sent
   * @param expiresAt when the link stops working
   * @returns the change's id
   */
  public async replace(change: Omit<PendingEmailChange, 'id'>, tokenHash: Buffer, expiresAt: Date): Promise<string> {
    await this.unitOfWork.db
      .delete(guardianEmailChanges)
      .where(
        and(
          eq(guardianEmailChanges.registrationId, change.registrationId),
          eq(guardianEmailChanges.position, change.position),
          isNull(guardianEmailChanges.confirmedAt),
        ),
      );
    const [row] = await this.unitOfWork.db
      .insert(guardianEmailChanges)
      .values({ ...change, tokenHash, expiresAt, organisationId: this.unitOfWork.organisationId })
      .returning({ id: guardianEmailChanges.id });

    if (row === undefined) {
      throw new Error('The email change was not recorded');
    }

    return row.id;
  }

  /**
   * Give a waiting change the token its link carries.
   * @param id the change's id
   * @param tokenHash SHA-256 of the link's token
   * @returns the change, or null when it was confirmed or replaced meanwhile
   */
  public async issue(id: string, tokenHash: Buffer): Promise<PendingEmailChange | null> {
    const [row] = await this.unitOfWork.db
      .update(guardianEmailChanges)
      .set({ tokenHash })
      .where(and(eq(guardianEmailChanges.id, id), isNull(guardianEmailChanges.confirmedAt)))
      .returning(pending);

    return row ?? null;
  }

  /**
   * List a Registration's email changes still waiting, unexpired.
   * @param registrationId Registration id
   * @param now the instant
   */
  public async listPending(registrationId: string, now: Date): Promise<PendingEmailChange[]> {
    return this.unitOfWork.db
      .select(pending)
      .from(guardianEmailChanges)
      .where(
        and(
          eq(guardianEmailChanges.registrationId, registrationId),
          isNull(guardianEmailChanges.confirmedAt),
          gt(guardianEmailChanges.expiresAt, now),
        ),
      );
  }

  /**
   * Confirm an unexpired, unconfirmed email change of the current Organisation by its link's token, once.
   * @param tokenHash SHA-256 of the link's token
   * @param now the instant of use
   * @returns the change, or null when the link is unknown, used or expired
   */
  public async confirm(tokenHash: Buffer, now: Date): Promise<PendingEmailChange | null> {
    const [row] = await this.unitOfWork.db
      .update(guardianEmailChanges)
      .set({ confirmedAt: now })
      .where(
        and(
          eq(guardianEmailChanges.tokenHash, tokenHash),
          isNull(guardianEmailChanges.confirmedAt),
          gt(guardianEmailChanges.expiresAt, now),
        ),
      )
      .returning(pending);

    return row ?? null;
  }

  /**
   * Record a change made at once, by an admin, for its notice: any change of that guardian still waiting is
   * replaced, so no earlier link can undo it.
   * @param change the Registration, the guardian's position and the new email
   * @param previousEmail the guardian's email before the change
   * @param tokenHash SHA-256 of a token no link carries
   * @param now the instant of the change
   * @returns the change's id
   */
  public async recordConfirmed(
    change: Omit<PendingEmailChange, 'id'>,
    previousEmail: string,
    tokenHash: Buffer,
    now: Date,
  ): Promise<string> {
    const id = await this.replace(change, tokenHash, now);

    await this.unitOfWork.db
      .update(guardianEmailChanges)
      .set({ confirmedAt: now, previousEmail })
      .where(eq(guardianEmailChanges.id, id));

    return id;
  }

  /**
   * Keep the email a confirmed change replaced, for its notice.
   * @param id the change's id
   * @param previousEmail the guardian's email before the change
   */
  public async keepPreviousEmail(id: string, previousEmail: string): Promise<void> {
    await this.unitOfWork.db.update(guardianEmailChanges).set({ previousEmail }).where(eq(guardianEmailChanges.id, id));
  }

  /**
   * Remove a confirmed change, once, for its notice.
   * @param id the change's id
   * @returns the Registration, the new email and the previous one, or null when already taken
   */
  public async takeConfirmed(
    id: string,
  ): Promise<{ registrationId: string; email: string; previousEmail: string } | null> {
    const [row] = await this.unitOfWork.db
      .delete(guardianEmailChanges)
      .where(and(eq(guardianEmailChanges.id, id), isNotNull(guardianEmailChanges.confirmedAt)))
      .returning({
        registrationId: guardianEmailChanges.registrationId,
        email: guardianEmailChanges.email,
        previousEmail: guardianEmailChanges.previousEmail,
      });

    return row === undefined || row.previousEmail === null ? null : { ...row, previousEmail: row.previousEmail };
  }

  /**
   * Remove the current Organisation's email changes whose links expired before an instant.
   * @param before the instant
   * @returns how many were removed
   */
  public async removeExpired(before: Date): Promise<number> {
    const removed = await this.unitOfWork.db
      .delete(guardianEmailChanges)
      .where(lt(guardianEmailChanges.expiresAt, before))
      .returning({ id: guardianEmailChanges.id });

    return removed.length;
  }
}
