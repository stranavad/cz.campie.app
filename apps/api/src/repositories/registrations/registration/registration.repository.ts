import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, inArray, sql, sum } from 'drizzle-orm';

import type { Answers } from '@repo/schema/form-engine';
import type { PriceLineKind } from '@repo/schema/pricing';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import {
  declarationAnswers,
  participants,
  priceLines,
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
    const [row] = await this.unitOfWork.db.select().from(registrations).where(eq(registrations.id, id)).for('update');

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new RegistrationEntity(row);
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
  public async listDeclarationAnswers(registrationId: string): Promise<{ declarationId: string; accepted: boolean }[]> {
    return this.unitOfWork.db
      .select({ declarationId: declarationAnswers.declarationId, accepted: declarationAnswers.accepted })
      .from(declarationAnswers)
      .where(eq(declarationAnswers.registrationId, registrationId));
  }

  /**
   * Add a Registration's price lines in their order.
   * @param registrationId Registration id
   * @param lines the lines, a Participant's named by its position
   * @param participantIds the Participants' ids by position
   */
  public async addPriceLines(
    registrationId: string,
    lines: readonly PriceLineFields[],
    participantIds: readonly string[],
  ): Promise<void> {
    if (lines.length === 0) {
      return;
    }

    await this.unitOfWork.db.insert(priceLines).values(
      lines.map(({ participant, ...line }, position) => ({
        ...line,
        registrationId,
        position,
        participantId: participant === null ? null : (participantIds[participant] ?? null),
        organisationId: this.unitOfWork.organisationId,
      })),
    );
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
