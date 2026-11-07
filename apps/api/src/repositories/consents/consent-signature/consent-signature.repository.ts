import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { consentSignatures, consentWithdrawals } from '../../../db/schema.ts';

export type ConsentSignatureRow = InferSelectModel<typeof consentSignatures>;
export type ConsentWithdrawalRow = InferSelectModel<typeof consentWithdrawals>;
export type CreateConsentSignature = Omit<
  InferInsertModel<typeof consentSignatures>,
  'id' | 'organisationId' | 'fileId'
>;

// Signatures are only added; the signed PDF is the one thing a signature gains later.
@Injectable()
export class ConsentSignatureRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record a signature in the current Organisation.
   * @param input the signature and its evidence
   * @throws {Error} when the database returns no row
   */
  public async create(input: CreateConsentSignature): Promise<ConsentSignatureRow> {
    const [row] = await this.unitOfWork.db
      .insert(consentSignatures)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The signature was not recorded');
    }

    return row;
  }

  /**
   * Get a signature of the current Organisation.
   * @param id signature id
   */
  public async getById(id: string): Promise<ConsentSignatureRow | null> {
    const [row] = await this.unitOfWork.db.select().from(consentSignatures).where(eq(consentSignatures.id, id));

    return row ?? null;
  }

  /**
   * List the newest signature of each Consent for each of Participants.
   * @param participantIds Participant ids
   */
  public async listNewestOf(participantIds: readonly string[]): Promise<ConsentSignatureRow[]> {
    if (participantIds.length === 0) {
      return [];
    }

    return this.unitOfWork.db
      .selectDistinctOn([consentSignatures.participantId, consentSignatures.consentId])
      .from(consentSignatures)
      .where(inArray(consentSignatures.participantId, [...participantIds]))
      .orderBy(
        consentSignatures.participantId,
        consentSignatures.consentId,
        desc(consentSignatures.signedAt),
        desc(consentSignatures.id),
      );
  }

  /**
   * Get a Participant's newest signature of a Consent.
   * @param participantId Participant id
   * @param consentId Consent id
   */
  public async getNewest(participantId: string, consentId: string): Promise<ConsentSignatureRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(consentSignatures)
      .where(and(eq(consentSignatures.participantId, participantId), eq(consentSignatures.consentId, consentId)))
      .orderBy(desc(consentSignatures.signedAt), desc(consentSignatures.id))
      .limit(1);

    return row ?? null;
  }

  /**
   * Attach the signed PDF to a signature that has none yet.
   * @param id signature id
   * @param fileId the stored PDF
   * @returns whether it was attached; false when the signature already had one
   */
  public async setFile(id: string, fileId: string): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .update(consentSignatures)
      .set({ fileId })
      .where(and(eq(consentSignatures.id, id), isNull(consentSignatures.fileId)))
      .returning({ id: consentSignatures.id });

    return rows.length > 0;
  }

  /**
   * Record the withdrawal of a signature in the current Organisation.
   * @param input the signature, who withdrew it, from where and when
   * @throws {Error} when the database returns no row
   */
  public async addWithdrawal(
    input: Omit<ConsentWithdrawalRow, 'id' | 'organisationId'>,
  ): Promise<ConsentWithdrawalRow> {
    const [row] = await this.unitOfWork.db
      .insert(consentWithdrawals)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The withdrawal was not recorded');
    }

    return row;
  }

  /**
   * Find when each of signatures was withdrawn.
   * @param signatureIds signature ids
   * @returns the withdrawal time by signature id; one not withdrawn is missing
   */
  public async withdrawnAtOf(signatureIds: readonly string[]): Promise<Map<string, Date>> {
    if (signatureIds.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select({ signatureId: consentWithdrawals.signatureId, withdrawnAt: consentWithdrawals.withdrawnAt })
      .from(consentWithdrawals)
      .where(inArray(consentWithdrawals.signatureId, [...signatureIds]));

    return new Map(rows.map(({ signatureId, withdrawnAt }) => [signatureId, withdrawnAt]));
  }
}
