import { Injectable, NotFoundException } from '@nestjs/common';

import { ageOnStart, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  formFields,
  withOptionLabels,
  type Answers,
  type FieldScope,
  type FormDefinition,
} from '@repo/schema/form-engine';
import type {
  AnswerRow,
  ClaimedDiscountErrorCode,
  HistoryEntry,
  RegistrationDetail,
  VerifyClaimedDiscountBody,
} from '@repo/schema/registrations';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import { AuditEntryRepository } from '../../../../repositories/audit/audit-entry/audit-entry.repository.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { ClaimedDiscountVerificationRepository } from '../../../../repositories/registrations/claimed-discount-verification/claimed-discount-verification.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';
import { answeredDefinition, claimedDiscountsOf } from '../../payment/claimed-discounts.helper.ts';

// One Registration as an admin sees it, its history from the audit log, and the confirmation of its
// Claimed discounts. Permission (Registrations) is the route's.
@Injectable()
export class RegistrationDetailService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly verifications: ClaimedDiscountVerificationRepository,
    private readonly ledgers: LedgerService,
    private readonly files: FileService,
    private readonly auditEntries: AuditEntryRepository,
    private readonly admins: AdminRepository,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * Get a Registration in full: answers labelled as its form version asked them, with fields added later and
   * removed ones marked, its guardians, Participants, price, ledger, declarations and Claimed discounts.
   * @param registrationId Registration id
   */
  public async get(registrationId: string): Promise<RegistrationDetail> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const version = await this.forms.getVersionByIdOrThrow(registration.formVersionId);
    const latest = (await this.forms.getLatestVersion(camp.id)) ?? version;
    const published = (await this.forms.listPublished(camp.id)).map(({ definition }) => definition);
    const participants = await this.registrations.listParticipants(registrationId);
    const verifications = await this.verifications.listOf(participants.map(({ id }) => id));
    const answered = await this.registrations.listDeclarationAnswers(registrationId);
    const merged = answeredDefinition(version.definition, latest.definition);
    const rowsOf = (scope: FieldScope, answers: Answers) =>
      answerRows(scope, version.definition, latest.definition, published, answers);

    return {
      id: registration.id,
      variableSymbol: registration.variableSymbol,
      submittedAt: registration.submittedAt.toISOString(),
      paymentChoice: registration.paymentChoice,
      formVersion: version.version,
      camp: { id: camp.id, name: camp.name },
      turnus: { id: turnus.id, name: turnus.name, startDate: turnus.startDate, endDate: turnus.endDate },
      guardians: (await this.registrations.listGuardians(registrationId)).map((guardian, index) => ({
        position: index + 1,
        ...guardian,
      })),
      participants: await Promise.all(
        participants.map(async (participant) => ({
          id: participant.id,
          position: participant.position,
          firstName: participant.firstName,
          lastName: participant.lastName,
          birthDate: participant.birthDate,
          ageOnStart: ageOnStart(participant.birthDate, turnus.startDate),
          status: participant.status,
          prihlaska: participant.prihlaskaFileId === null ? null : await this.files.link(participant.prihlaskaFileId),
          answers: rowsOf('participant', participant.answers),
        })),
      ),
      registrationAnswers: rowsOf('registration', registration.answers),
      priceLines: await this.registrations.listPriceLines(registrationId),
      ledger: await this.ledgers.get(registrationId),
      declarations: version.declarations.map(({ id, text, mandatory }) => {
        const answer = answered.find(({ declarationId }) => declarationId === id);

        return {
          text,
          mandatory,
          accepted: answer?.accepted ?? false,
          answeredAt: answer?.answeredAt.toISOString() ?? null,
        };
      }),
      claimedDiscounts: participants.flatMap((participant) =>
        claimedDiscountsOf(merged, registration.answers, participant, verifications).map((discount) => ({
          participantId: participant.id,
          ...discount,
          verifiedAt: discount.verifiedAt?.toISOString() ?? null,
        })),
      ),
    };
  }

  /**
   * List the audit entries of a Registration and its Participants, newest first, admins named by email.
   * @param registrationId Registration id
   */
  public async history(registrationId: string): Promise<HistoryEntry[]> {
    await this.registrations.getByIdOrThrow(registrationId);
    const participants = await this.registrations.listParticipants(registrationId);
    const entries = await this.auditEntries.listByTargets([registrationId, ...participants.map(({ id }) => id)]);
    const adminIds = entries.flatMap(({ actorKind, actorIdentity }) =>
      (actorKind === 'admin' || actorKind === 'operator') && actorIdentity !== null ? [actorIdentity] : [],
    );
    const emails = await this.admins.listEmailsByIds([...new Set(adminIds)]);

    return entries.map((entry) => ({
      id: entry.id,
      occurredAt: entry.occurredAt.toISOString(),
      actor: {
        kind: entry.actorKind,
        name:
          entry.actorIdentity === null
            ? null
            : entry.actorKind === 'guardian'
              ? entry.actorIdentity
              : (emails.get(entry.actorIdentity) ?? null),
      },
      action: entry.action,
      changes: entry.changes,
      encryptedFields: entry.encryptedFields,
    }));
  }

  /**
   * Confirm a Participant's Claimed discount after checking it, audited; confirming it again changes nothing.
   * @param actor who confirms it
   * @param registrationId Registration id
   * @param body the Participant and the answer
   * @throws {NotFoundException} claimed_discount_unknown when the Participant has no such Claimed discount
   * needing verification
   */
  public async verifyClaimedDiscount(
    actor: Actor,
    registrationId: string,
    body: VerifyClaimedDiscountBody,
  ): Promise<RegistrationDetail> {
    const detail = await this.get(registrationId);
    const discount = detail.claimedDiscounts.find(
      ({ participantId, fieldId, optionId }) =>
        participantId === body.participantId && fieldId === body.fieldId && optionId === body.optionId,
    );

    if (discount === undefined) {
      const code: ClaimedDiscountErrorCode = 'claimed_discount_unknown';

      throw new NotFoundException({ code, message: 'No such Claimed discount' });
    }

    const verification = {
      participantId: body.participantId,
      fieldId: body.fieldId,
      optionId: body.optionId ?? '',
      verifiedAt: this.clock.now(),
    };

    if (await this.verifications.create(verification)) {
      await this.audit.record(actor, {
        action: 'claimed_discount.verify',
        target: { type: 'participant', id: body.participantId },
        change: { before: null, after: { ...verification, label: discount.label, amount: discount.amount } },
      });
    }

    return this.get(registrationId);
  }
}

/**
 * List a scope's answers as an admin reads them: the fields of the Registration's version under its labels
 * (removed when the latest no longer asks them), fields added since under the latest labels, and answers to
 * fields neither asks under the label of the newest version that did. The core is shown on its own.
 * @param scope per Registration or per Participant
 * @param version the Registration's form
 * @param latest the latest form
 * @param published every version, oldest first
 * @param answers the stored answers
 */
function answerRows(
  scope: FieldScope,
  version: FormDefinition,
  latest: FormDefinition,
  published: readonly FormDefinition[],
  answers: Answers,
): AnswerRow[] {
  const fieldsOf = (definition: FormDefinition) =>
    formFields(definition, REGISTRATION_FIELD_CATALOGUE, scope).filter(({ tier }) => tier !== 'core');
  const asked = fieldsOf(version);
  const latestKeys = new Set(fieldsOf(latest).map(({ key }) => key));
  const known = new Set([...asked.map(({ key }) => key), ...latestKeys]);
  const shown = (field: (typeof asked)[number], state: AnswerRow['state']): AnswerRow => {
    const value = answers[field.key] ?? null;

    return {
      key: field.key,
      label: field.tier === 'custom' ? field.field.label : null,
      labelKey: field.tier === 'standard' ? field.labelKey : null,
      value: field.tier === 'custom' && value !== null ? withOptionLabels(field.field, value) : value,
      state,
    };
  };
  const newest = [...published].reverse();

  return [
    ...asked.map((field) => shown(field, latestKeys.has(field.key) ? 'answered' : 'removed')),
    ...fieldsOf(latest)
      .filter(({ key }) => !asked.some((field) => field.key === key))
      .map((field) => shown(field, 'added')),
    ...Object.entries(answers)
      .filter(
        ([key]) =>
          !known.has(key) && !formFields(version, REGISTRATION_FIELD_CATALOGUE, scope).some((f) => f.key === key),
      )
      .map(([key, value]): AnswerRow => {
        const field = newest.flatMap(({ custom }) => custom).find(({ id }) => id === key);

        return {
          key,
          label: field?.label ?? key,
          labelKey: null,
          value: field === undefined || value === null ? value : withOptionLabels(field, value),
          state: 'removed',
        };
      }),
  ];
}
