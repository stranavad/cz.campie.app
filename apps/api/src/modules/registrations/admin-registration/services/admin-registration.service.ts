import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  checkAnswersTo,
  formFields,
  surchargesOf,
  type Answers,
  type AnswerValue,
  type CustomField,
  type FieldScope,
  type FormDefinition,
} from '@repo/schema/form-engine';
import { dueDatesOf, percentageCodeLine, priceInForce } from '@repo/schema/pricing';
import type {
  AddParticipantBody,
  AdminRegistrationErrorCode,
  EditAnswersBody,
  EditGuardianBody,
  ErasureErrorCode,
  PriceChange,
  RegistrationDetail,
  SaveAddParticipantBody,
  SaveEditAnswersBody,
  TurnusForm,
} from '@repo/schema/registrations';
import type { FieldError } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { generateSessionToken, hashSessionToken } from '../../../../core/sessions/session-token.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { DiscountCodeRepository } from '../../../../repositories/camps/discount-code/discount-code.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import type { TurnusEntity } from '../../../../repositories/camps/turnus/turnus.entity.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { GuardianEmailChangeRepository } from '../../../../repositories/registrations/guardian-email-change/guardian-email-change.repository.ts';
import type { ParticipantEntity } from '../../../../repositories/registrations/participant/participant.entity.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import {
  RegistrationRepository,
  type ParticipantFields,
  type PriceLineFields,
} from '../../../../repositories/registrations/registration/registration.repository.ts';
import { UndeliverableEmailService } from '../../../emails/undeliverable-email/services/undeliverable-email.service.ts';
import { emailChangeConfirmedJob } from '../../guardian-email/guardian-email-notice.job.ts';
import { answeredDefinition } from '../../payment/claimed-discounts.helper.ts';
import { regeneratePrihlaskaJob } from '../../prihlaska/regenerate-prihlaska.job.ts';
import { RegistrationDetailService } from '../../registration-detail/services/registration-detail.service.ts';

// A Registration with everything a change of it needs.
interface Loaded {
  readonly registration: RegistrationEntity;
  readonly turnus: TurnusEntity;
  readonly camp: CampEntity;
  // The fields an admin may answer: the Registration's own version's that the latest form still asks, as
  // that version asked them, and fields added since, as the latest asks them.
  readonly editable: FormDefinition;
  readonly participants: readonly ParticipantEntity[];
}

/**
 * Refuse a change with the code the app translates.
 * @param code the code
 */
function refused(code: AdminRegistrationErrorCode): ConflictException {
  return new ConflictException({ code, message: `Change refused: ${code}` });
}

/**
 * Refuse answers that do not fit the form, with the reasons at their fields.
 * @param errors the reasons
 */
function invalid(errors: readonly FieldError[]): BadRequestException {
  const code: AdminRegistrationErrorCode = 'submission_invalid';

  return new BadRequestException({ code, message: 'The answers do not fit the form', fields: errors });
}

/**
 * Apply checked answers to stored ones: a null clears an answer.
 * @param stored the stored answers
 * @param change the checked answers
 */
function merged(stored: Answers, change: Readonly<Record<string, AnswerValue>>): Answers {
  const next: Record<string, AnswerValue> = { ...stored };

  for (const [key, value] of Object.entries(change)) {
    if (value === null) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }

  return next;
}

/**
 * List the options an answer chose: a choice's ids, null for a yes, nothing otherwise.
 * @param field the field
 * @param value the answer
 */
function chosenOf(field: CustomField, value: AnswerValue | undefined): (string | null)[] {
  if (field.type === 'yes_no') {
    return value === true ? [null] : [];
  }

  return typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
}

/**
 * Price one chosen option of a field at its amount now, as a line of a Participant.
 * @param field the field
 * @param optionId the chosen option, or null for a yes
 * @param participant the Participant's position
 */
function lineFor(field: CustomField, optionId: string | null, participant: number): PriceLineFields[] {
  const option =
    field.type === 'single_choice' || field.type === 'multiple_choice'
      ? field.options.find(({ id }) => id === optionId)
      : undefined;
  const priced =
    field.type === 'yes_no'
      ? { label: field.label, amount: field.surcharge }
      : option === undefined
        ? null
        : { label: `${field.label}: ${option.label}`, amount: option.surcharge };

  return priced === null || priced.amount === null || priced.amount === 0
    ? []
    : [
        {
          kind: priced.amount < 0 ? 'claimed_discount' : 'paid_extra',
          participant,
          label: priced.label,
          amount: priced.amount,
          source: { fieldId: field.id, optionId },
        },
      ];
}

/**
 * Tell whether two lists of price lines are the same, as a preview and its save compare them.
 * @param one the lines
 * @param other the other lines
 */
function sameLines(
  one: readonly Pick<PriceLineFields, 'kind' | 'participant' | 'label' | 'amount'>[],
  other: readonly Pick<PriceLineFields, 'kind' | 'participant' | 'label' | 'amount'>[],
): boolean {
  const plain = (lines: typeof one) =>
    JSON.stringify(lines.map(({ kind, participant, label, amount }) => ({ kind, participant, label, amount })));

  return plain(one) === plain(other);
}

/**
 * List Participants' ids by their positions, as price lines name them.
 * @param participants the Participants
 */
function idsByPosition(participants: readonly { id: string; position: number }[]): string[] {
  const ids: string[] = [];

  for (const { id, position } of participants) {
    ids[position] = id;
  }

  return ids;
}

/**
 * Show planned price lines as a preview does.
 * @param lines the lines
 */
function shown(lines: readonly PriceLineFields[]): PriceChange {
  return { lines: lines.map(({ kind, participant, label, amount }) => ({ kind, participant, label, amount })) };
}

// An admin's changes to a Registration: any answer the latest form asks, a new Participant, a move to another
// Turnus of its Camp, and a guardian. Only the price lines a change touches are added, at today's prices;
// a changed answer's earlier lines are reversed exactly as charged. A save adds the lines its preview showed
// or is refused. Permission (Registrations write) is the route's.
@Injectable()
export class AdminRegistrationService {
  constructor(
    private readonly undeliverable: UndeliverableEmailService,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly discountCodes: DiscountCodeRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly emailChanges: GuardianEmailChangeRepository,
    private readonly details: RegistrationDetailService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
  ) {}

  /**
   * Get the latest form of a Turnus's Camp, for an admin creating a Registration.
   * @param turnusId Turnus id
   * @throws {NotFoundException} when the Camp has no published form
   */
  public async formOf(turnusId: string): Promise<TurnusForm> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const form = await this.forms.getLatestVersion(turnus.campId);

    if (form === null) {
      throw new NotFoundException();
    }

    return {
      campId: turnus.campId,
      definition: form.definition,
      maxParticipants: form.maxParticipants,
      declarations: form.declarations.map(({ id, text, mandatory }) => ({ id, text, mandatory })),
    };
  }

  /**
   * Tell which price lines changing answers would add, without saving.
   * @param registrationId Registration id
   * @param body the answers
   */
  public async previewAnswers(registrationId: string, body: EditAnswersBody): Promise<PriceChange> {
    return shown((await this.planAnswers(await this.load(registrationId, false), body)).lines);
  }

  /**
   * Change answers, audited, adding the price lines the preview showed.
   * @param actor the admin
   * @param registrationId Registration id
   * @param body the answers and the previewed lines
   * @throws {ConflictException} price_changed when the lines differ from the preview's
   */
  public async editAnswers(
    actor: Actor,
    registrationId: string,
    body: SaveEditAnswersBody,
  ): Promise<RegistrationDetail> {
    const loaded = await this.load(registrationId, true);
    const { registrationAnswers, children, lines } = await this.planAnswers(loaded, body);

    if (!sameLines(lines, body.expectedLines)) {
      throw refused('price_changed');
    }

    await this.registrations.setAnswers(registrationId, registrationAnswers);

    for (const [participantId, child] of children) {
      await this.registrations.updateParticipant(participantId, child);
    }

    await this.registrations.appendPriceLines(registrationId, lines, idsByPosition(loaded.participants));
    await this.audit.record(actor, {
      action: 'registration.edit',
      target: { type: 'registration', id: registrationId },
      change: {
        before: {
          answers: loaded.registration.answers,
          participants: loaded.participants.map(({ id, firstName, lastName, birthDate, answers }) => ({
            id,
            firstName,
            lastName,
            birthDate,
            answers,
          })),
        },
        after: {
          answers: registrationAnswers,
          participants: loaded.participants.map(({ id, firstName, lastName, birthDate, answers }) => ({
            id,
            ...(children.get(id) ?? { firstName, lastName, birthDate, answers }),
          })),
          priceLines: lines,
        },
      },
    });

    return this.details.get(registrationId);
  }

  /**
   * Tell which price lines adding a child would add, without saving.
   * @param registrationId Registration id
   * @param body the child's answers
   */
  public async previewParticipant(registrationId: string, body: AddParticipantBody): Promise<PriceChange> {
    return shown((await this.planParticipant(await this.load(registrationId, false), body)).lines);
  }

  /**
   * Add a child at the price list in force now, outside capacity and age limits, with the previewed lines,
   * audited.
   * @param actor the admin
   * @param registrationId Registration id
   * @param body the child's answers and the previewed lines
   * @throws {ConflictException} price_changed when the lines differ from the preview's
   */
  public async addParticipant(
    actor: Actor,
    registrationId: string,
    body: SaveAddParticipantBody,
  ): Promise<RegistrationDetail> {
    const loaded = await this.load(registrationId, true);
    const { child, position, lines } = await this.planParticipant(loaded, body);

    if (!sameLines(lines, body.expectedLines)) {
      throw refused('price_changed');
    }

    const participant = await this.registrations.addParticipant(registrationId, position, child);

    await this.registrations.appendPriceLines(
      registrationId,
      lines,
      idsByPosition([...loaded.participants, participant]),
    );
    await this.audit.record(actor, {
      action: 'participant.create',
      target: { type: 'participant', id: participant.id },
      change: { before: null, after: { ...child, priceLines: lines } },
    });

    return this.details.get(registrationId);
  }

  /**
   * Move a whole Registration to another Turnus of its Camp, outside capacity and age limits; its price
   * lines stay, and money is settled with Price adjustments. Its due dates become the other Turnus's for
   * its original submission, as if it had been submitted there. Audited.
   * @param actor the admin
   * @param registrationId Registration id
   * @param turnusId the other Turnus
   * @throws {ConflictException} turnus_other_camp when the Turnus belongs to another Camp
   */
  public async move(actor: Actor, registrationId: string, turnusId: string): Promise<RegistrationDetail> {
    const { registration, turnus } = await this.load(registrationId, true);
    const target = await this.turnusy.getByIdOrThrow(turnusId);

    if (target.campId !== turnus.campId) {
      throw refused('turnus_other_camp');
    }

    if (target.id !== registration.turnusId) {
      const dueDates = dueDatesOf({
        submittedAt: registration.submittedAt,
        depositDueDays: target.depositDueDays,
        balanceDueDate: target.balanceDueDate,
      });

      await this.registrations.setTurnus(registrationId, turnusId, dueDates);
      await this.audit.record(actor, {
        action: 'registration.move',
        target: { type: 'registration', id: registrationId },
        change: {
          before: {
            turnusId: registration.turnusId,
            depositDueDate: registration.depositDueDate,
            balanceDueDate: registration.balanceDueDate,
          },
          after: { turnusId, ...dueDates },
        },
      });
    }

    return this.details.get(registrationId);
  }

  /**
   * Change a guardian of a Registration, audited. A new email holds at once, replaces any change the
   * guardian is still confirming, and the old address is told once this commits.
   * @param actor the admin
   * @param registrationId Registration id
   * @param position the guardian's position, 1 or 2
   * @param body the guardian
   * @throws {ConflictException} guardian_email_taken when the other guardian has the email
   */
  public async editGuardian(
    actor: Actor,
    registrationId: string,
    position: number,
    body: EditGuardianBody,
  ): Promise<RegistrationDetail> {
    await this.load(registrationId, true);
    const guardians = await this.registrations.listGuardians(registrationId);
    const before = guardians[position - 1];

    if (before === undefined) {
      throw new NotFoundException();
    }

    if (guardians.some((guardian, index) => index !== position - 1 && guardian.email === body.email)) {
      throw refused('guardian_email_taken');
    }

    await this.registrations.updateGuardian(registrationId, position, body);
    await this.audit.record(actor, {
      action: 'registration_guardian.update',
      target: { type: 'registration', id: registrationId },
      change: { before: { position, ...before }, after: { position, ...body } },
    });
    // A changed address, such as one corrected after a bounce, starts without a mark.
    if (body.email !== before.email) {
      await this.undeliverable.clear(actor, body.email);
    }

    if (body.email !== before.email) {
      const changeId = await this.emailChanges.recordConfirmed(
        { registrationId, position, email: body.email },
        before.email,
        hashSessionToken(generateSessionToken()),
        this.clock.now(),
      );

      this.jobs.enqueue(emailChangeConfirmedJob, { changeId });
    }

    return this.details.get(registrationId);
  }

  /**
   * Give another address portal access to a Registration, audited; it receives no automatic email.
   * @param actor the admin
   * @param registrationId Registration id
   * @param email the address
   * @throws {ConflictException} access_email_taken when the Registration has the address as a guardian or
   * an access email already
   */
  public async addAccessEmail(actor: Actor, registrationId: string, email: string): Promise<RegistrationDetail> {
    await this.load(registrationId, true);
    const guardians = await this.registrations.listGuardians(registrationId);

    if (
      guardians.some((guardian) => guardian.email === email) ||
      !(await this.registrations.addAccessEmail(registrationId, email))
    ) {
      throw refused('access_email_taken');
    }

    await this.audit.record(actor, {
      action: 'registration_access_email.create',
      target: { type: 'registration', id: registrationId },
      change: { before: null, after: { email } },
    });

    return this.details.get(registrationId);
  }

  /**
   * Clear the undeliverable mark of one of the Registration's guardian or access email addresses, audited.
   * @param actor the admin
   * @param registrationId Registration id
   * @param email the address, lowercase
   * @throws {NotFoundException} when the address is neither a guardian's nor an access email of the Registration
   */
  public async clearUndeliverable(actor: Actor, registrationId: string, email: string): Promise<RegistrationDetail> {
    await this.load(registrationId, false);
    const guardians = await this.registrations.listGuardians(registrationId);
    const accessEmails = await this.registrations.listAccessEmails(registrationId);

    // Only an address of this Registration, so the route clears no mark of another family or a Camp team.
    if (![...guardians, ...accessEmails].some((known) => known.email === email)) {
      throw new NotFoundException();
    }

    await this.undeliverable.clear(actor, email);

    return this.details.get(registrationId);
  }

  /**
   * Take an access email's portal access away, audited.
   * @param actor the admin
   * @param registrationId Registration id
   * @param accessEmailId the access email
   */
  public async removeAccessEmail(
    actor: Actor,
    registrationId: string,
    accessEmailId: string,
  ): Promise<RegistrationDetail> {
    await this.load(registrationId, true);
    const email = await this.registrations.removeAccessEmail(registrationId, accessEmailId);

    await this.audit.record(actor, {
      action: 'registration_access_email.remove',
      target: { type: 'registration', id: registrationId },
      change: { before: { email }, after: null },
    });

    return this.details.get(registrationId);
  }

  /**
   * Remove one of two guardians, who loses access at once, audited; the other becomes the first.
   * @param actor the admin
   * @param registrationId Registration id
   * @param position the guardian's position, 1 or 2
   * @throws {ConflictException} guardian_last when the Registration would have no guardian
   */
  public async removeGuardian(actor: Actor, registrationId: string, position: number): Promise<RegistrationDetail> {
    await this.load(registrationId, true);
    const guardians = await this.registrations.listGuardians(registrationId);
    const removed = guardians[position - 1];

    if (removed === undefined) {
      throw new NotFoundException();
    }

    if (guardians.length < 2) {
      throw refused('guardian_last');
    }

    await this.registrations.removeGuardian(registrationId, position);
    await this.audit.record(actor, {
      action: 'registration_guardian.remove',
      target: { type: 'registration', id: registrationId },
      change: { before: { position, ...removed }, after: null },
    });

    return this.details.get(registrationId);
  }

  /**
   * Ask for a Participant's Přihláška to be generated again, from a job, audited.
   * @param actor the admin
   * @param registrationId Registration id
   * @param participantId Participant id
   * @throws {NotFoundException} when the Registration has no such Participant
   */
  public async regeneratePrihlaska(actor: Actor, registrationId: string, participantId: string): Promise<void> {
    const { participants } = await this.load(registrationId, false);

    if (!participants.some(({ id }) => id === participantId)) {
      throw new NotFoundException();
    }

    await this.audit.record(actor, {
      action: 'participant.request_prihlaska',
      target: { type: 'participant', id: participantId },
    });
    this.jobs.enqueue(regeneratePrihlaskaJob, { participantId });
  }

  /**
   * Load a Registration with its Turnus, Camp, editable fields and Participants.
   * @param registrationId Registration id
   * @param lock whether to lock it until the unit of work ends, for a change
   */
  private async load(registrationId: string, lock: boolean): Promise<Loaded> {
    const registration = lock
      ? await this.registrations.lockByIdOrThrow(registrationId)
      : await this.registrations.getByIdOrThrow(registrationId);

    if (registration.erasedAt !== null) {
      const code: ErasureErrorCode = 'registration_erased';

      throw new ConflictException({ code, message: 'The Registration was erased' });
    }
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const version = await this.forms.getVersionByIdOrThrow(registration.formVersionId);
    const latest = (await this.forms.getLatestVersion(camp.id))?.definition ?? version.definition;
    const asked = new Set(
      (['registration', 'participant'] as const).flatMap((scope) =>
        formFields(latest, REGISTRATION_FIELD_CATALOGUE, scope).map(({ key }) => key),
      ),
    );
    const all = answeredDefinition(version.definition, latest);

    return {
      registration,
      turnus,
      camp,
      editable: {
        standard: all.standard.filter(({ key }) => asked.has(key)),
        custom: all.custom.filter(({ id }) => asked.has(id)),
      },
      participants: await this.registrations.listParticipants(registrationId),
    };
  }

  /**
   * Check changed answers and work out the Registration's answers, each changed child, and the price lines
   * a changed surcharge answer adds: an option no longer chosen reversed as charged, a newly chosen one at
   * today's amount, on every Registered Participant it concerns.
   * @param loaded the Registration
   * @param body the answers
   * @throws {BadRequestException} submission_invalid with the reasons in `fields`
   */
  private async planAnswers(
    loaded: Loaded,
    body: EditAnswersBody,
  ): Promise<{ registrationAnswers: Answers; children: Map<string, ParticipantFields>; lines: PriceLineFields[] }> {
    const fieldsOf = (scope: FieldScope) =>
      formFields(loaded.editable, REGISTRATION_FIELD_CATALOGUE, scope).filter(
        (field) => scope === 'participant' || field.tier !== 'core',
      );
    const errors: FieldError[] = [];
    const check = (scope: FieldScope, answers: Answers, path: (string | number)[]) => {
      const checked = checkAnswersTo(fieldsOf(scope), answers, path);

      errors.push(...checked.errors.map((error) => ({ ...error, path: [...error.path] })));

      // An admin may change an answer, but not empty one the form requires.
      for (const field of fieldsOf(scope)) {
        if (field.required && checked.value[field.key] === null) {
          errors.push({ path: [...path, field.key], code: 'form_answer_required' });
        }
      }

      return checked.value;
    };
    const registrationChange = check('registration', body.registration, ['registration']);
    const children = new Map<string, ParticipantFields>();

    body.participants.forEach(({ participantId, answers }, index) => {
      const participant = loaded.participants.find(({ id }) => id === participantId);

      if (participant === undefined) {
        throw new NotFoundException();
      }

      const { firstName, lastName, birthDate, ...rest } = check('participant', answers, ['participants', index]);

      children.set(participantId, {
        firstName: typeof firstName === 'string' ? firstName : participant.firstName,
        lastName: typeof lastName === 'string' ? lastName : participant.lastName,
        birthDate: typeof birthDate === 'string' ? birthDate : (participant.birthDate ?? ''),
        answers: merged(participant.answers, rest),
      });
    });

    if (errors.length > 0) {
      throw invalid(errors);
    }

    const registrationAnswers = merged(loaded.registration.answers, registrationChange);
    const charged = await this.registrations.listSurchargeLines(loaded.registration.id);
    const registered = loaded.participants.filter(({ status }) => status === 'registered');
    const lines: PriceLineFields[] = [];

    for (const field of loaded.editable.custom) {
      const changes =
        field.scope === 'registration'
          ? [{ old: loaded.registration.answers[field.id], next: registrationAnswers[field.id], on: registered }]
          : registered.map((participant) => ({
              old: participant.answers[field.id],
              next: (children.get(participant.id)?.answers ?? participant.answers)[field.id],
              on: [participant],
            }));

      for (const { old, next, on } of changes) {
        const before = chosenOf(field, old);
        const after = chosenOf(field, next);

        for (const participant of on) {
          for (const optionId of before.filter((option) => !after.includes(option))) {
            const earlier = charged.filter(
              (line) =>
                line.participantId === participant.id && line.fieldId === field.id && line.optionId === optionId,
            );
            const net = earlier.reduce((sum, { amount }) => sum + amount, 0);
            const [first] = earlier;

            if (net !== 0 && first !== undefined) {
              lines.push({
                kind: first.kind,
                participant: participant.position,
                label: first.label,
                amount: -net,
                source: { fieldId: field.id, optionId },
              });
            }
          }

          for (const optionId of after.filter((option) => !before.includes(option))) {
            lines.push(...lineFor(field, optionId, participant.position));
          }
        }
      }
    }

    return { registrationAnswers, children, lines };
  }

  /**
   * Check a new child's answers and price it now: the price in force, its surcharges with the
   * Registration's own, the Registration's percentage Discount code off the child's price, and the Sibling
   * discount, to the new child and, when the Camp gives it to every child, to each Registered child that has
   * none yet.
   * @param loaded the Registration
   * @param body the child's answers
   * @throws {BadRequestException} submission_invalid with the reasons in `fields`
   */
  private async planParticipant(
    loaded: Loaded,
    body: AddParticipantBody,
  ): Promise<{ child: ParticipantFields; position: number; lines: PriceLineFields[] }> {
    const fields = formFields(loaded.editable, REGISTRATION_FIELD_CATALOGUE, 'participant');
    const checked = checkAnswersTo(fields, body.answers, ['answers']);
    const errors: FieldError[] = checked.errors.map((error) => ({ ...error, path: [...error.path] }));

    for (const field of fields) {
      if (field.required && (checked.value[field.key] ?? null) === null) {
        errors.push({ path: ['answers', field.key], code: 'form_answer_required' });
      }
    }

    const { firstName, lastName, birthDate, ...rest } = checked.value;

    // The core is required, so a child without a name or birth date has failed the check above.
    if (
      errors.length > 0 ||
      typeof firstName !== 'string' ||
      typeof lastName !== 'string' ||
      typeof birthDate !== 'string'
    ) {
      throw invalid(errors);
    }

    const child: ParticipantFields = { firstName, lastName, birthDate, answers: merged({}, rest) };
    const position = Math.max(-1, ...loaded.participants.map((participant) => participant.position)) + 1;
    const price = priceInForce(loaded.turnus, this.clock.now());
    const [surcharges] = surchargesOf(loaded.editable, {
      registration: loaded.registration.answers,
      participants: [child.answers],
    });
    const registered = loaded.participants.filter(({ status }) => status === 'registered');
    const sibling = loaded.camp.toSiblingDiscount();
    const lines: PriceLineFields[] = [
      { kind: price.kind, participant: position, label: null, amount: price.amount },
      ...(surcharges?.surcharges ?? []).map(({ label, amount, fieldId, optionId }) => ({
        kind: amount < 0 ? ('claimed_discount' as const) : ('paid_extra' as const),
        participant: position,
        label,
        amount,
        source: { fieldId, optionId },
      })),
    ];
    // The code the Registration was submitted with, whatever its limit or expiry now: a fixed one came off
    // the total once and gives nothing more.
    const code = await this.discountCodes.getUsedBy(loaded.registration.id);
    const percentage = code === null ? null : percentageCodeLine(code.toPricing(), price.amount, position);

    if (percentage !== null && percentage.amount !== 0) {
      lines.push(percentage);
    }

    if (sibling !== null && registered.length >= 1) {
      lines.push({ kind: 'sibling_discount', participant: position, label: null, amount: -sibling.amount });

      if (sibling.appliesTo === 'every_child') {
        const priced = await this.registrations.listPriceLines(loaded.registration.id);

        for (const { position: other } of registered) {
          const discounted = priced
            .filter((line) => line.kind === 'sibling_discount' && line.participant === other)
            .reduce((sum, { amount }) => sum + amount, 0);

          if (discounted === 0) {
            lines.push({ kind: 'sibling_discount', participant: other, label: null, amount: -sibling.amount });
          }
        }
      }
    }

    return { child, position, lines };
  }
}
