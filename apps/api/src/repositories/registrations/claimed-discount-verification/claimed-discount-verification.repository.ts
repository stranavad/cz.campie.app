import { Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { claimedDiscountVerifications } from '../../../db/schema.ts';

export interface ClaimedDiscountVerification {
  readonly participantId: string;
  readonly fieldId: string;
  // Empty for a yes.
  readonly optionId: string;
  readonly verifiedAt: Date;
}

@Injectable()
export class ClaimedDiscountVerificationRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List the confirmed Claimed discounts of Participants, in one query.
   * @param participantIds Participant ids
   */
  public async listOf(participantIds: readonly string[]): Promise<ClaimedDiscountVerification[]> {
    if (participantIds.length === 0) {
      return [];
    }

    return this.unitOfWork.db
      .select({
        participantId: claimedDiscountVerifications.participantId,
        fieldId: claimedDiscountVerifications.fieldId,
        optionId: claimedDiscountVerifications.optionId,
        verifiedAt: claimedDiscountVerifications.verifiedAt,
      })
      .from(claimedDiscountVerifications)
      .where(inArray(claimedDiscountVerifications.participantId, [...participantIds]));
  }

  /**
   * Confirm a Participant's Claimed discount in the current Organisation; confirming it again changes nothing.
   * @param verification the answer and when it was confirmed
   * @returns whether it was not confirmed before
   */
  public async create(verification: ClaimedDiscountVerification): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .insert(claimedDiscountVerifications)
      .values({ ...verification, organisationId: this.unitOfWork.organisationId })
      .onConflictDoNothing()
      .returning({ id: claimedDiscountVerifications.id });

    return rows.length > 0;
  }
}
