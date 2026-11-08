import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, isNull, or, sql, sum } from 'drizzle-orm';

import type { Answers } from '@repo/schema/form-engine';
import type { DueDates, PriceLineKind, SurchargeSource } from '@repo/schema/pricing';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import {
  declarationAnswers,
  guardianEmailChanges,
  participants,
  priceLines,
  registrationAccessEmails,
  registrationGuardians,
  registrations,
} from '../../../db/schema.ts';
import { ParticipantEntity } from '../participant/participant.entity.ts';
import { RegistrationEntity, type RegistrationInsertModel } from './registration.entity.ts';

export type CreateRegistration = Omit<RegistrationInsertModel, 'id' | 'organisationId'>;

export interface GuardianFields {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
}

export interface ParticipantFields {
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly answers: Answers;
}

export interface PriceLineFields {
  readonly kind: PriceLineKind;
  // The Participant's position, or null for the Registration as a whole.
  readonly participant: number | null;
  readonly label: string | null;
  readonly amount: number;
  readonly source?: SurchargeSource;
}

export interface DeclarationAnswerFields {
  readonly declarationId: string;
  readonly accepted: boolean;
  readonly answeredAt: Date;
  readonly ipAddress: string;
}

// A Registration with what belongs to it: its guardians, Participants, price lines and declaration answers.
@Injectable()
export class RegistrationRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Hold a submission's idempotency key until the unit of work ends, so a second submission with the same
   * key waits for the first and then finds its Registration.
   * @param key the form's idempotency key
   */
  public async lockIdempotencyKey(key: string): Promise<void> {
    await this.unitOfWork.db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`registration:${this.unitOfWork.organisationId}:${key}`}, 0))`,
    );
  }

  /**
   * Get the Registration a submission with an idempotency key created.
   * @param key the form's idempotency key
   */
  public async getByIdempotencyKey(key: string): Promise<RegistrationEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(registrations).where(eq(registrations.idempotencyKey, key));

    return row === undefined ? null : new RegistrationEntity(row);
  }

  /**
   * Get a Registration of the current Organisation by id, or throw if missing.
   * @param id Registration id
   * @throws {NotFoundException} when no Registration has this id in the current Organisation
   */
  public async getByIdOrThrow(id: string): Promise<RegistrationEntity> {
    const [row] = await this.unitOfWork.db.select().from(registrations).where(eq(registrations.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new RegistrationEntity(row);
  }

  /**
   * Get a Registration of the current Organisation by id and lock its row until the unit of work ends, so
   * changes to its money run one at a time.
   * @param id Registration id
   * @throws {NotFoundException} when no Registration has this id in the current Organisation
   */
  public async lockByIdOrThrow(id: string): Promise<RegistrationEntity> {
    const registration = await this.lockById(id);

    if (registration === null) {
      throw new NotFoundException();
    }

    return registration;
  }

  /**
   * Get a Registration of the current Organisation by id and lock its row until the unit of work ends.
   * @param id Registration id
   */
  public async lockById(id: string): Promise<RegistrationEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(registrations).where(eq(registrations.id, id)).for('update');

    return row === undefined ? null : new RegistrationEntity(row);
  }

  /**
   * List the Registrations of the current Organisation that name a guardian by email, newest first.
   * @param email the guardian's email, lowercase
   */
  public async listByGuardian(email: string): Promise<RegistrationEntity[]> {
    const rows = await this.unitOfWork.db
      .select()
      .from(registrations)
      .where(this.namesEmail(email))
      .orderBy(desc(registrations.submittedAt), desc(registrations.id));

    return rows.map((row) => new RegistrationEntity(row));
  }

  /**
   * Get a Registration of the current Organisation that names a guardian by email.
   * @param email the guardian's email, lowercase
   * @param id Registration id
   * @param access whether an access email counts too, as it does for seeing the Registration but not for
   * changing it
   */
  public async getByGuardian(email: string, id: string, access = true): Promise<RegistrationEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(registrations)
      .where(and(eq(registrations.id, id), this.namesEmail(email, access)));

    return row === undefined ? null : new RegistrationEntity(row);
  }

  /**
   * List a Registration's access emails.
   * @param registrationId Registration id
   */
  public async listAccessEmails(registrationId: string): Promise<{ id: string; email: string }[]> {
    return this.unitOfWork.db
      .select({ id: registrationAccessEmails.id, email: registrationAccessEmails.email })
      .from(registrationAccessEmails)
      .where(eq(registrationAccessEmails.registrationId, registrationId))
      .orderBy(asc(registrationAccessEmails.email));
  }

  /**
   * Give an address access to a Registration of the current Organisation.
   * @param registrationId Registration id
   * @param email the address, lowercase
   * @returns false when the Registration has the address already
   */
  public async addAccessEmail(registrationId: string, email: string): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .insert(registrationAccessEmails)
      .values({ registrationId, email, organisationId: this.unitOfWork.organisationId })
      .onConflictDoNothing()
      .returning({ id: registrationAccessEmails.id });

    return rows.length > 0;
  }

  /**
   * Take an access email of a Registration away.
   * @param registrationId Registration id
   * @param id the access email's id
   * @returns its address
   * @throws {NotFoundException} when the Registration has no such access email
   */
  public async removeAccessEmail(registrationId: string, id: string): Promise<string> {
    const [row] = await this.unitOfWork.db
      .delete(registrationAccessEmails)
      .where(and(eq(registrationAccessEmails.id, id), eq(registrationAccessEmails.registrationId, registrationId)))
      .returning({ email: registrationAccessEmails.email });

    if (row === undefined) {
      throw new NotFoundException();
    }

    return row.email;
  }

  /**
   * Remove one of a Registration's two guardians, and every change of email still waiting; the other becomes
   * the first.
   * @param registrationId Registration id
   * @param position the guardian's position, 1 or 2
   */
  public async removeGuardian(registrationId: string, position: number): Promise<void> {
    // A change of email still waiting names a position, which the other guardian is about to take.
    await this.unitOfWork.db
      .delete(guardianEmailChanges)
      .where(and(eq(guardianEmailChanges.registrationId, registrationId), isNull(guardianEmailChanges.confirmedAt)));
    await this.unitOfWork.db
      .delete(registrationGuardians)
      .where(
        and(eq(registrationGuardians.registrationId, registrationId), eq(registrationGuardians.position, position)),
      );
    await this.unitOfWork.db
      .update(registrationGuardians)
      .set({ position: 1 })
      .where(eq(registrationGuardians.registrationId, registrationId));
  }

  /**
   * Mark Participants Cancelled.
   * @param participantIds Participant ids
   */
  public async cancelParticipants(participantIds: readonly string[]): Promise<void> {
    if (participantIds.length === 0) {
      return;
    }

    await this.unitOfWork.db
      .update(participants)
      .set({ status: 'cancelled' })
      .where(inArray(participants.id, [...participantIds]));
  }

  /**
   * Match the Registrations that name an email as a guardian or, unless left out, an access email.
   * @param email the email, lowercase
   * @param access whether an access email counts
   */
  private namesEmail(email: string, access = true) {
    const guardian = inArray(
      registrations.id,
      this.unitOfWork.db
        .select({ id: registrationGuardians.registrationId })
        .from(registrationGuardians)
        .where(eq(registrationGuardians.email, email)),
    );

    if (!access) {
      return guardian;
    }

    return or(
      inArray(
        registrations.id,
        this.unitOfWork.db
          .select({ id: registrationGuardians.registrationId })
          .from(registrationGuardians)
          .where(eq(registrationGuardians.email, email)),
      ),
      inArray(
        registrations.id,
        this.unitOfWork.db
          .select({ id: registrationAccessEmails.registrationId })
          .from(registrationAccessEmails)
          .where(eq(registrationAccessEmails.email, email)),
      ),
    );
  }

  /**
   * List the Registrations of a Turnus.
   * @param turnusId Turnus id
   */
  public async listByTurnus(turnusId: string): Promise<RegistrationEntity[]> {
    const rows = await this.unitOfWork.db.select().from(registrations).where(eq(registrations.turnusId, turnusId));

    return rows.map((row) => new RegistrationEntity(row));
  }

  /**
   * List the Participants of Registrations, in one query.
   * @param registrationIds Registration ids
   */
  public async listParticipantsOf(registrationIds: readonly string[]): Promise<ParticipantEntity[]> {
    if (registrationIds.length === 0) {
      return [];
    }

    const rows = await this.unitOfWork.db
      .select()
      .from(participants)
      .where(inArray(participants.registrationId, [...registrationIds]));

    return rows.map((row) => new ParticipantEntity(row));
  }

  /**
   * List the guardians of each of Registrations, the first one first, in one query.
   * @param registrationIds Registration ids
   * @returns the guardians by Registration id
   */
  public async listGuardiansOf(registrationIds: readonly string[]): Promise<Map<string, GuardianFields[]>> {
    const guardians = new Map<string, GuardianFields[]>();

    if (registrationIds.length === 0) {
      return guardians;
    }

    const rows = await this.unitOfWork.db
      .select()
      .from(registrationGuardians)
      .where(inArray(registrationGuardians.registrationId, [...registrationIds]))
      .orderBy(asc(registrationGuardians.position));

    for (const { registrationId, firstName, lastName, email, phone } of rows) {
      guardians.set(registrationId, [...(guardians.get(registrationId) ?? []), { firstName, lastName, email, phone }]);
    }

    return guardians;
  }

  /**
   * Sum the price lines of each of Registrations, in one query.
   * @param registrationIds Registration ids
   * @returns the sum by Registration id; one without lines is missing
   */
  public async sumPriceLinesOf(registrationIds: readonly string[]): Promise<Map<string, number>> {
    if (registrationIds.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select({ registrationId: priceLines.registrationId, total: sum(priceLines.amount).mapWith(Number) })
      .from(priceLines)
      .where(inArray(priceLines.registrationId, [...registrationIds]))
      .groupBy(priceLines.registrationId);

    return new Map(rows.map(({ registrationId, total }) => [registrationId, total ?? 0]));
  }

  /**
   * Count the Registered Participants of Turnusy, in one query.
   * @param turnusIds Turnus ids
   * @returns Registered Participants by Turnus id; a Turnus without any is missing
   */
  public async countRegistered(turnusIds: readonly string[]): Promise<Map<string, number>> {
    if (turnusIds.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select({ turnusId: registrations.turnusId, registered: count() })
      .from(participants)
      .innerJoin(registrations, eq(registrations.id, participants.registrationId))
      .where(and(inArray(registrations.turnusId, [...turnusIds]), eq(participants.status, 'registered')))
      .groupBy(registrations.turnusId);

    return new Map(rows.map(({ turnusId, registered }) => [turnusId, registered]));
  }

  /**
   * Create a Registration of the current Organisation, unless its Variable symbol is taken.
   * @param input the Registration
   * @returns the Registration, or null when another of the Organisation has the Variable symbol
   */
  public async create(input: CreateRegistration): Promise<RegistrationEntity | null> {
    const [row] = await this.unitOfWork.db
      .insert(registrations)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .onConflictDoNothing({ target: [registrations.organisationId, registrations.variableSymbol] })
      .returning();

    return row === undefined ? null : new RegistrationEntity(row);
  }

  /**
   * Add a Registration's guardians, the first one first.
   * @param registrationId Registration id
   * @param guardians one or two guardians
   */
  public async addGuardians(registrationId: string, guardians: readonly GuardianFields[]): Promise<void> {
    await this.unitOfWork.db.insert(registrationGuardians).values(
      guardians.map((guardian, index) => ({
        ...guardian,
        registrationId,
        position: index + 1,
        organisationId: this.unitOfWork.organisationId,
      })),
    );
  }

  /**
   * Add a Registration's Participants, Registered, in the form's order.
   * @param registrationId Registration id
   * @param children the children
   */
  public async addParticipants(
    registrationId: string,
    children: readonly ParticipantFields[],
  ): Promise<ParticipantEntity[]> {
    const rows = await this.unitOfWork.db
      .insert(participants)
      .values(
        children.map((child, position) => ({
          ...child,
          registrationId,
          position,
          organisationId: this.unitOfWork.organisationId,
        })),
      )
      .returning();

    return rows.map((row) => new ParticipantEntity(row)).sort((a, b) => a.position - b.position);
  }

  /**
   * List a Registration's Participants in the form's order.
   * @param registrationId Registration id
   */
  public async listParticipants(registrationId: string): Promise<ParticipantEntity[]> {
    const rows = await this.unitOfWork.db
      .select()
      .from(participants)
      .where(eq(participants.registrationId, registrationId))
      .orderBy(asc(participants.position));

    return rows.map((row) => new ParticipantEntity(row));
  }

  /**
   * Get a Participant of the current Organisation by id, or throw if missing.
   * @param id Participant id
   * @throws {NotFoundException} when no Participant has this id in the current Organisation
   */
  public async getParticipantOrThrow(id: string): Promise<ParticipantEntity> {
    const [row] = await this.unitOfWork.db.select().from(participants).where(eq(participants.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new ParticipantEntity(row);
  }

  /**
   * Get a Participant of the current Organisation by id and lock its row until the unit of work ends, so
   * changes to it run one at a time.
   * @param id Participant id
   * @throws {NotFoundException} when no Participant has this id in the current Organisation
   */
  public async lockParticipantOrThrow(id: string): Promise<ParticipantEntity> {
    const [row] = await this.unitOfWork.db.select().from(participants).where(eq(participants.id, id)).for('update');

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new ParticipantEntity(row);
  }

  /**
   * Point a Participant to its Přihláška PDF.
   * @param id Participant id
   * @param fileId the stored PDF
   * @throws {NotFoundException} when no Participant has this id in the current Organisation
   */
  public async setPrihlaska(id: string, fileId: string): Promise<void> {
    const rows = await this.unitOfWork.db
      .update(participants)
      .set({ prihlaskaFileId: fileId })
      .where(eq(participants.id, id))
      .returning({ id: participants.id });

    if (rows.length === 0) {
      throw new NotFoundException();
    }
  }

  /**
   * List a Registration's guardians, the first one first.
   * @param registrationId Registration id
   */
  public async listGuardians(registrationId: string): Promise<GuardianFields[]> {
    return this.unitOfWork.db
      .select({
        firstName: registrationGuardians.firstName,
        lastName: registrationGuardians.lastName,
        email: registrationGuardians.email,
        phone: registrationGuardians.phone,
      })
      .from(registrationGuardians)
      .where(eq(registrationGuardians.registrationId, registrationId))
      .orderBy(asc(registrationGuardians.position));
  }

  /**
   * List a Registration's price lines in their order, a Participant's named by its position.
   * @param registrationId Registration id
   */
  public async listPriceLines(registrationId: string): Promise<PriceLineFields[]> {
    return this.unitOfWork.db
      .select({
        kind: priceLines.kind,
        participant: participants.position,
        label: priceLines.label,
        amount: priceLines.amount,
      })
      .from(priceLines)
      .leftJoin(participants, eq(participants.id, priceLines.participantId))
      .where(eq(priceLines.registrationId, registrationId))
      .orderBy(asc(priceLines.position));
  }

  /**
   * List a Registration's declaration answers.
   * @param registrationId Registration id
   */
  public async listDeclarationAnswers(
    registrationId: string,
  ): Promise<{ declarationId: string; accepted: boolean; answeredAt: Date }[]> {
    return this.unitOfWork.db
      .select({
        declarationId: declarationAnswers.declarationId,
        accepted: declarationAnswers.accepted,
        answeredAt: declarationAnswers.answeredAt,
      })
      .from(declarationAnswers)
      .where(eq(declarationAnswers.registrationId, registrationId));
  }

  /**
   * Change a guardian's name and phone, or email, on a Registration of the current Organisation.
   * @param registrationId Registration id
   * @param position the guardian's position, 1 or 2
   * @param fields the fields to change
   * @throws {NotFoundException} when the Registration has no guardian at this position
   */
  public async updateGuardian(
    registrationId: string,
    position: number,
    fields: Partial<GuardianFields>,
  ): Promise<void> {
    const rows = await this.unitOfWork.db
      .update(registrationGuardians)
      .set(fields)
      .where(
        and(eq(registrationGuardians.registrationId, registrationId), eq(registrationGuardians.position, position)),
      )
      .returning({ id: registrationGuardians.id });

    if (rows.length === 0) {
      throw new NotFoundException();
    }
  }

  /**
   * Add a guardian at a position of a Registration of the current Organisation.
   * @param registrationId Registration id
   * @param position the position, 1 or 2
   * @param guardian the guardian
   */
  public async addGuardian(registrationId: string, position: number, guardian: GuardianFields): Promise<void> {
    await this.unitOfWork.db
      .insert(registrationGuardians)
      .values({ ...guardian, registrationId, position, organisationId: this.unitOfWork.organisationId });
  }

  /**
   * Replace a Registration's per-Registration answers.
   * @param registrationId Registration id
   * @param answers all its answers beyond the core
   */
  public async setAnswers(registrationId: string, answers: Answers): Promise<void> {
    await this.unitOfWork.db.update(registrations).set({ answers }).where(eq(registrations.id, registrationId));
  }

  /**
   * Add a Participant to a Registration at a position, Registered.
   * @param registrationId Registration id
   * @param position its place among the Registration's Participants
   * @param child the child
   */
  public async addParticipant(
    registrationId: string,
    position: number,
    child: ParticipantFields,
  ): Promise<ParticipantEntity> {
    const [row] = await this.unitOfWork.db
      .insert(participants)
      .values({ ...child, registrationId, position, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Participant was not added');
    }

    return new ParticipantEntity(row);
  }

  /**
   * Replace a Participant's core answers and answers beyond the core.
   * @param participantId Participant id
   * @param child the child's name, birth date and answers
   */
  public async updateParticipant(participantId: string, child: ParticipantFields): Promise<void> {
    await this.unitOfWork.db.update(participants).set(child).where(eq(participants.id, participantId));
  }

  /**
   * Move a Registration to another Turnus, with the due dates it has there.
   * @param registrationId Registration id
   * @param turnusId the other Turnus
   * @param dueDates the deposit and balance due dates in the other Turnus
   */
  public async setTurnus(registrationId: string, turnusId: string, dueDates: DueDates): Promise<void> {
    await this.unitOfWork.db
      .update(registrations)
      .set({ turnusId, depositDueDate: dueDates.depositDueDate, balanceDueDate: dueDates.balanceDueDate })
      .where(eq(registrations.id, registrationId));
  }

  /**
   * Replace a Participant's answers beyond the core.
   * @param participantId Participant id
   * @param answers all its answers beyond the core
   */
  public async setParticipantAnswers(participantId: string, answers: Answers): Promise<void> {
    await this.unitOfWork.db.update(participants).set({ answers }).where(eq(participants.id, participantId));
  }

  /**
   * Add price lines after a Registration's existing ones, as a new answer with a surcharge does.
   * @param registrationId Registration id
   * @param lines the lines, a Participant's named by its position
   * @param participantIds the Participants' ids by position
   */
  public async appendPriceLines(
    registrationId: string,
    lines: readonly PriceLineFields[],
    participantIds: readonly string[],
  ): Promise<void> {
    const [row] = await this.unitOfWork.db
      .select({ next: sql<number>`coalesce(max(${priceLines.position}) + 1, 0)`.mapWith(Number) })
      .from(priceLines)
      .where(eq(priceLines.registrationId, registrationId));

    await this.addPriceLines(registrationId, lines, participantIds, row?.next ?? 0);
  }

  /**
   * Add a Registration's price lines in their order.
   * @param registrationId Registration id
   * @param lines the lines, a Participant's named by its position
   * @param participantIds the Participants' ids by position
   * @param from the first line's position
   */
  public async addPriceLines(
    registrationId: string,
    lines: readonly PriceLineFields[],
    participantIds: readonly string[],
    from = 0,
  ): Promise<void> {
    if (lines.length === 0) {
      return;
    }

    await this.unitOfWork.db.insert(priceLines).values(
      lines.map(({ participant, source, ...line }, index) => ({
        ...line,
        fieldId: source?.fieldId ?? null,
        optionId: source?.optionId ?? null,
        registrationId,
        position: from + index,
        participantId: participant === null ? null : (participantIds[participant] ?? null),
        organisationId: this.unitOfWork.organisationId,
      })),
    );
  }

  /**
   * List a Registration's lines that came from form answers, with the answer each came from.
   * @param registrationId Registration id
   */
  public async listSurchargeLines(registrationId: string): Promise<
    {
      participantId: string | null;
      fieldId: string;
      optionId: string | null;
      kind: PriceLineKind;
      label: string | null;
      amount: number;
    }[]
  > {
    const rows = await this.unitOfWork.db
      .select({
        participantId: priceLines.participantId,
        fieldId: priceLines.fieldId,
        optionId: priceLines.optionId,
        kind: priceLines.kind,
        label: priceLines.label,
        amount: priceLines.amount,
      })
      .from(priceLines)
      .where(eq(priceLines.registrationId, registrationId))
      .orderBy(asc(priceLines.position));

    return rows.flatMap(({ fieldId, ...line }) => (fieldId === null ? [] : [{ ...line, fieldId }]));
  }

  /**
   * Sum a Registration's price lines.
   * @param registrationId Registration id
   */
  public async totalOf(registrationId: string): Promise<number> {
    const [row] = await this.unitOfWork.db
      .select({ total: sum(priceLines.amount).mapWith(Number) })
      .from(priceLines)
      .where(eq(priceLines.registrationId, registrationId));

    return row?.total ?? 0;
  }

  /**
   * Record a Registration's declaration answers.
   * @param registrationId Registration id
   * @param answers one per declaration of the form version
   */
  public async addDeclarationAnswers(
    registrationId: string,
    answers: readonly DeclarationAnswerFields[],
  ): Promise<void> {
    if (answers.length === 0) {
      return;
    }

    await this.unitOfWork.db
      .insert(declarationAnswers)
      .values(answers.map((answer) => ({ ...answer, registrationId, organisationId: this.unitOfWork.organisationId })));
  }
}
