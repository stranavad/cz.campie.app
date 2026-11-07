import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  checkAnswersTo,
  diffVersions,
  formFields,
  pricedFieldIds,
  surchargesOf,
  withOptionLabels,
  type Answers,
  type AnswerValue,
  type CustomField,
  type FieldScope,
  type FormDefinition,
} from '@repo/schema/form-engine';
import type {
  AddGuardianBody,
  AnswerNewFieldsBody,
  GuardianContactBody,
  GuardianEdit,
  GuardianEditErrorCode,
} from '@repo/schema/portal';
import { pragueDateOf, type FieldError } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { RegistrationFormVersionEntity } from '../../../../repositories/camps/registration-form/registration-form.entity.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { GuardianEmailChangeRepository } from '../../../../repositories/registrations/guardian-email-change/guardian-email-change.repository.ts';
import type { ParticipantEntity } from '../../../../repositories/registrations/participant/participant.entity.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import {
  RegistrationRepository,
  type PriceLineFields,
} from '../../../../repositories/registrations/registration/registration.repository.ts';
import { GuardianLoginService } from '../../guardian-session/services/guardian-login.service.ts';

// A Registration as a guardian may edit it: the version it was submitted under, the latest form, and the
// Camp's lock date.
export interface EditableRegistration {
  readonly registration: RegistrationEntity;
  readonly campId: string;
  readonly version: RegistrationFormVersionEntity;
  readonly latest: RegistrationFormVersionEntity;
  readonly lockDate: string | null;
}

/**
 * Refuse an edit with the code the portal translates.
 * @param code the code
 */
function refused(code: GuardianEditErrorCode): ConflictException {
  return new ConflictException({ code, message: `Edit refused: ${code}` });
}

/**
 * Tell whether an answer says something.
 * @param value the answer
 */
function answered(value: AnswerValue | undefined): boolean {
  return value !== undefined && value !== null;
}

// What a guardian changes on a Registration in the portal until the Camp's contact-edit lock date: the
// guardians' names and phones, a second guardian, and answers to fields added to the form since the
// Registration was submitted. Email changes go through GuardianEmailChangeService.
@Injectable()
export class GuardianEditService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly emailChanges: GuardianEmailChangeRepository,
    private readonly logins: GuardianLoginService,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * Show what a guardian may change on one of their Registrations.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   */
  public async get(email: string, registrationId: string): Promise<GuardianEdit> {
    return this.show(await this.load(email, registrationId));
  }

  /**
   * Change a guardian's name and phone, audited.
   * @param actor the signed-in guardian
   * @param email their email
   * @param registrationId Registration id
   * @param position the guardian's position, 1 or 2
   * @param body the name and phone
   */
  public async updateContact(
    actor: Actor,
    email: string,
    registrationId: string,
    position: number,
    body: GuardianContactBody,
  ): Promise<GuardianEdit> {
    const editable = await this.loadEditable(email, registrationId);
    const before = (await this.registrations.listGuardians(registrationId))[position - 1];

    if (before === undefined) {
      throw new NotFoundException();
    }

    await this.registrations.updateGuardian(registrationId, position, body);
    await this.audit.record(actor, {
      action: 'registration_guardian.update',
      target: { type: 'registration', id: registrationId },
      change: { before: { position, ...before }, after: { position, ...before, ...body } },
    });

    return this.show(editable);
  }

  /**
   * Add a second guardian, who has access at once and gets a login link, audited.
   * @param actor the signed-in guardian
   * @param email their email
   * @param registrationId Registration id
   * @param body the second guardian
   * @throws {ConflictException} guardian_second_exists or guardian_email_taken
   */
  public async addGuardian(
    actor: Actor,
    email: string,
    registrationId: string,
    body: AddGuardianBody,
  ): Promise<GuardianEdit> {
    const editable = await this.loadEditable(email, registrationId);
    const guardians = await this.registrations.listGuardians(registrationId);

    if (guardians.length >= 2) {
      throw refused('guardian_second_exists');
    }

    if (guardians.some((guardian) => guardian.email === body.email)) {
      throw refused('guardian_email_taken');
    }

    await this.registrations.addGuardian(registrationId, 2, body);
    await this.audit.record(actor, {
      action: 'registration_guardian.create',
      target: { type: 'registration', id: registrationId },
      change: { before: null, after: { position: 2, ...body } },
    });
    await this.logins.invite(body.email);

    return this.show(editable);
  }

  /**
   * Answer fields added to the form since the Registration was submitted, audited. The first answer to a
   * field with a surcharge adds its price line at the amount the form shows now; a later change of it is
   * refused.
   * @param actor the signed-in guardian
   * @param email their email
   * @param registrationId Registration id
   * @param body the answers per Registration and per Participant
   * @throws {BadRequestException} submission_invalid with the reasons in `fields`
   * @throws {ConflictException} answer_locked when a given surcharge answer would change
   */
  public async answerNewFields(
    actor: Actor,
    email: string,
    registrationId: string,
    body: AnswerNewFieldsBody,
  ): Promise<GuardianEdit> {
    const editable = await this.loadEditable(email, registrationId);
    const { registration, latest } = editable;
    const participants = await this.registrations.listParticipants(registrationId);
    const offered = this.newFieldIds(editable);
    const fieldsOf = (scope: FieldScope) =>
      formFields(latest.definition, REGISTRATION_FIELD_CATALOGUE, scope).filter(({ key }) => offered.includes(key));
    const checkedRegistration = checkAnswersTo(fieldsOf('registration'), body.registration, ['registration']);
    const checkedParticipants = body.participants.map(({ participantId, answers }, index) => {
      const participant = participants.find(({ id }) => id === participantId);

      if (participant === undefined) {
        throw new NotFoundException();
      }

      return { participant, ...checkAnswersTo(fieldsOf('participant'), answers, ['participants', index]) };
    });
    const errors: FieldError[] = [
      ...checkedRegistration.errors,
      ...checkedParticipants.flatMap(({ errors: participantErrors }) => participantErrors),
    ].map(({ path, code, params }) => ({ path: [...path], code, params }));

    if (errors.length > 0) {
      const code: GuardianEditErrorCode = 'submission_invalid';

      throw new BadRequestException({ code, message: 'The answers do not fit the form', fields: errors });
    }

    const priced = pricedFieldIds(latest.definition).filter((id) => offered.includes(id));
    const registrationAnswers = merged(registration.answers, checkedRegistration.value);
    const participantAnswers = new Map(
      participants.map((participant) => {
        const change = checkedParticipants.find((checked) => checked.participant.id === participant.id);

        return [participant.id, change === undefined ? participant.answers : merged(participant.answers, change.value)];
      }),
    );
    const lines: PriceLineFields[] = [];

    // Each answer to a field with a surcharge is priced once, when first given, and frozen from then on.
    for (const field of latest.definition.custom.filter(({ id }) => priced.includes(id))) {
      const answers =
        field.scope === 'registration'
          ? [{ before: registration.answers[field.id], after: registrationAnswers[field.id], on: participants }]
          : participants.map((participant) => ({
              before: participant.answers[field.id],
              after: participantAnswers.get(participant.id)?.[field.id],
              on: [participant],
            }));

      for (const { before, after, on } of answers) {
        if (answered(before)) {
          if (JSON.stringify(before) !== JSON.stringify(after)) {
            throw refused('answer_locked');
          }
        } else if (answered(after)) {
          lines.push(...surchargeLinesOf(field, after ?? null, on));
        }
      }
    }

    await this.registrations.setAnswers(registrationId, registrationAnswers);

    for (const participant of participants) {
      await this.registrations.setParticipantAnswers(participant.id, participantAnswers.get(participant.id) ?? {});
    }

    await this.registrations.appendPriceLines(
      registrationId,
      lines,
      participants.map(({ id }) => id),
    );
    await this.audit.record(actor, {
      action: 'registration.answer',
      target: { type: 'registration', id: registrationId },
      change: {
        before: { answers: registration.answers, participants: participants.map(({ answers }) => answers) },
        after: {
          answers: registrationAnswers,
          participants: participants.map(({ id }) => participantAnswers.get(id) ?? {}),
          priceLines: lines,
        },
      },
    });

    return this.show(await this.load(email, registrationId));
  }

  /**
   * Find one of a guardian's Registrations with its form versions and lock date.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when no Registration of the Organisation with this id names the guardian
   */
  public async load(email: string, registrationId: string): Promise<EditableRegistration> {
    // Only a guardian changes a Registration; an access email may only see it.
    const registration = await this.registrations.getByGuardian(email, registrationId, false);

    if (registration === null) {
      throw new NotFoundException();
    }

    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const version = await this.forms.getVersionByIdOrThrow(registration.formVersionId);
    const latest = (await this.forms.getLatestVersion(camp.id)) ?? version;

    return { registration, campId: camp.id, version, latest, lockDate: camp.contactEditLockDate };
  }

  /**
   * Find one of a guardian's Registrations that may still be edited, and lock it until the unit of work ends.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @throws {ConflictException} registration_locked after the Camp's contact-edit lock date
   */
  public async loadEditable(email: string, registrationId: string): Promise<EditableRegistration> {
    const editable = await this.load(email, registrationId);

    if (!this.isEditable(editable.lockDate)) {
      throw refused('registration_locked');
    }

    // Edits of one Registration run one at a time, so two never price the same answer or take one place.
    await this.registrations.lockByIdOrThrow(registrationId);

    return editable;
  }

  /**
   * Tell whether edits are still open: through the lock date, on the Prague calendar.
   * @param lockDate the Camp's contact-edit lock date, or null for none
   */
  public isEditable(lockDate: string | null): boolean {
    return lockDate === null || pragueDateOf(this.clock.now()) <= lockDate;
  }

  /**
   * List the fields the latest form asks that the Registration's own version did not.
   * @param editable the Registration and its versions
   */
  private newFieldIds({ version, latest }: EditableRegistration): string[] {
    return diffVersions(version.definition, latest.definition).added;
  }

  /**
   * Show a Registration as the portal's edit page does.
   * @param editable the Registration and its versions
   */
  private async show(editable: EditableRegistration): Promise<GuardianEdit> {
    const { registration, latest, lockDate } = editable;
    const participants = await this.registrations.listParticipants(registration.id);
    const guardians = await this.registrations.listGuardians(registration.id);
    const pending = await this.emailChanges.listPending(registration.id, this.clock.now());
    const added = this.newFieldIds(editable);
    const asked = new Set(
      (['registration', 'participant'] as const).flatMap((scope) =>
        formFields(latest.definition, REGISTRATION_FIELD_CATALOGUE, scope).map(({ key }) => key),
      ),
    );
    // A field the latest form no longer asks keeps the label of the newest version that asked it.
    const published = (await this.forms.listPublished(editable.campId)).toReversed();
    const fieldOf = (key: string) =>
      published.flatMap(({ definition }) => definition.custom).find(({ id }) => id === key);
    const removedOf = (answers: Answers, participantId: string | null) =>
      Object.entries(answers).flatMap(([key, value]) => {
        const field = fieldOf(key);

        return asked.has(key) || !answered(value)
          ? []
          : [
              {
                participantId,
                label: field?.label ?? key,
                value: field === undefined ? value : withOptionLabels(field, value),
              },
            ];
      });

    return {
      editable: this.isEditable(lockDate),
      lockDate,
      definition: latest.definition,
      newFieldIds: added,
      lockedAnswers: pricedFieldIds(latest.definition)
        .filter((id) => added.includes(id))
        .flatMap((fieldId) => [
          ...(answered(registration.answers[fieldId]) ? [{ participantId: null, fieldId }] : []),
          ...participants.flatMap(({ id, answers }) =>
            answered(answers[fieldId]) ? [{ participantId: id, fieldId }] : [],
          ),
        ]),
      guardians: guardians.map((guardian, index) => ({
        position: index + 1,
        ...guardian,
        pendingEmail: pending.find(({ position }) => position === index + 1)?.email ?? null,
      })),
      registrationAnswers: registration.answers,
      participants: participants.map(({ id, firstName, lastName, answers }) => ({ id, firstName, lastName, answers })),
      removed: [
        ...removedOf(registration.answers, null),
        ...participants.flatMap(({ id, answers }) => removedOf(answers, id)),
      ],
    };
  }
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
 * Price a first answer to a field with a surcharge at the amount the form shows now, on each Registered
 * Participant it concerns: a per-Registration answer concerns them all.
 * @param field the field
 * @param value the answer
 * @param participants the Participants it concerns
 */
function surchargeLinesOf(
  field: CustomField,
  value: AnswerValue,
  participants: readonly ParticipantEntity[],
): PriceLineFields[] {
  const only: FormDefinition = { standard: [], custom: [field] };
  const answers = { [field.id]: value };
  const [child] = surchargesOf(only, {
    registration: field.scope === 'registration' ? answers : {},
    participants: [field.scope === 'participant' ? answers : {}],
  });

  return participants
    .filter(({ status }) => status === 'registered')
    .flatMap(({ position }) =>
      (child?.surcharges ?? []).map(({ label, amount, fieldId, optionId }) => ({
        kind: amount < 0 ? ('claimed_discount' as const) : ('paid_extra' as const),
        participant: position,
        label,
        amount,
        source: { fieldId, optionId },
      })),
    );
}
