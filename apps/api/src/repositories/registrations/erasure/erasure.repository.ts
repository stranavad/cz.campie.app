import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import {
  claimedDiscountVerifications,
  consentSignatures,
  declarationAnswers,
  documentUploads,
  guardianEmailChanges,
  internalDocuments,
  participants,
  registrationAccessEmails,
  registrationGuardians,
  registrations,
} from '../../../db/schema.ts';

// What erasing a Registration deletes and blanks across its tables, leaving the accounting tombstone:
// the Registration's Turnus and Variable symbol, its Participants as "Smazáno", price lines, Price
// adjustments and the payment ledger.
@Injectable()
export class ErasureRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List every stored file of a Registration's Participants: Přihlášky, handed-in documents, Internal
   * documents and signed Consents.
   * @param participantIds the Registration's Participant ids
   */
  public async listFilesOf(participantIds: readonly string[]): Promise<string[]> {
    if (participantIds.length === 0) {
      return [];
    }

    const ids = [...participantIds];
    const db = this.unitOfWork.db;
    const prihlasky = await db
      .select({ fileId: participants.prihlaskaFileId })
      .from(participants)
      .where(and(inArray(participants.id, ids), isNotNull(participants.prihlaskaFileId)));
    const uploads = await db
      .select({ fileId: documentUploads.fileId })
      .from(documentUploads)
      .where(and(inArray(documentUploads.participantId, ids), isNotNull(documentUploads.fileId)));
    const internal = await db
      .select({ fileId: internalDocuments.fileId })
      .from(internalDocuments)
      .where(inArray(internalDocuments.participantId, ids));
    const signed = await db
      .select({ fileId: consentSignatures.fileId })
      .from(consentSignatures)
      .where(and(inArray(consentSignatures.participantId, ids), isNotNull(consentSignatures.fileId)));

    return [...prihlasky, ...uploads, ...internal, ...signed].flatMap(({ fileId }) =>
      fileId === null ? [] : [fileId],
    );
  }

  /**
   * Delete and blank a Registration's personal data, leaving its tombstone; the protected tables are erased
   * by the database function made for it.
   * @param registrationId Registration id
   * @param participantIds its Participant ids
   * @param erasedAt when
   */
  public async erase(registrationId: string, participantIds: readonly string[], erasedAt: Date): Promise<void> {
    const db = this.unitOfWork.db;
    const ids = [...participantIds];

    if (ids.length > 0) {
      await db.delete(claimedDiscountVerifications).where(inArray(claimedDiscountVerifications.participantId, ids));
      await db.delete(documentUploads).where(inArray(documentUploads.participantId, ids));
      await db.delete(internalDocuments).where(inArray(internalDocuments.participantId, ids));
    }

    // Marked erased first: the protected function acts on nothing else.
    await db.update(registrations).set({ answers: {}, erasedAt }).where(eq(registrations.id, registrationId));
    await db.execute(sql`select erase_registration_protected(${registrationId})`);
    await db.delete(declarationAnswers).where(eq(declarationAnswers.registrationId, registrationId));
    await db.delete(guardianEmailChanges).where(eq(guardianEmailChanges.registrationId, registrationId));
    await db.delete(registrationAccessEmails).where(eq(registrationAccessEmails.registrationId, registrationId));
    await db.delete(registrationGuardians).where(eq(registrationGuardians.registrationId, registrationId));
    await db
      .update(participants)
      .set({ firstName: 'Smazáno', lastName: '', birthDate: null, answers: {}, prihlaskaFileId: null })
      .where(eq(participants.registrationId, registrationId));
  }
}
