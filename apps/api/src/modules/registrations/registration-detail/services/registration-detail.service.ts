import { Injectable, NotFoundException } from '@nestjs/common';

import { ageOnStart, isRegistrationFieldKey, REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  chosenOption,
  formFields,
  sensitiveKeys,
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

import type { AdminAccess } from '../../../../core/access/admin-access.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { EncryptionService } from '../../../../core/encryption/encryption.service.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { AuditEntryRepository } from '../../../../repositories/audit/audit-entry/audit-entry.repository.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { UndeliverableEmailRepository } from '../../../../repositories/emails/undeliverable-email/undeliverable-email.repository.ts';
import { ClaimedDiscountVerificationRepository } from '../../../../repositories/registrations/claimed-discount-verification/claimed-discount-verification.repository.ts';
import {
  RegistrationRepository,
  type StoredAnswers,
} from '../../../../repositories/registrations/registration/registration.repository.ts';
import { AuditEntryService } from '../../../organisations/audit-log/services/audit-entry.service.ts';
import { answerOpener, withoutHealth } from '../../answers/sealed-answers.helper.ts';
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
    private readonly undeliverable: UndeliverableEmailRepository,
    private readonly ledgers: LedgerService,
    private readonly files: FileService,
    private readonly auditEntries: AuditEntryRepository,
    private readonly readable: AuditEntryService,
    private readonly audit: AuditService,
    private readonly encryption: EncryptionService,
    private readonly clock: Clock,
  ) {}

  /**
   * Get a Registration in full: answers labelled as its form version asked them, with fields added later and
   * removed ones marked, its guardians, Participants, price, ledger, declarations and Claimed discounts.
   * Encrypted answers are decrypted for this response only; health data is in it only for a admin with
   * Health read, and showing it is audited.
   * @param registrationId Registration id
   * @param admin who looks, and what of health data they may
   */
  public async get(registrationId: string, admin: AdminAccess): Promise<RegistrationDetail> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const version = await this.forms.getVersionByIdOrThrow(registration.formVersionId);
    const latest = (await this.forms.getLatestVersion(camp.id)) ?? version;
    const published = (await this.forms.listPublished(camp.id)).map(({ definition }) => definition);
    const participants = await this.registrations.listParticipants(registrationId);
    const sensitive = sensitiveKeys([version.definition, ...published], REGISTRATION_FIELD_CATALOGUE);
    const open = await answerOpener(this.encryption, [registration, ...participants]);
    const shownAnswers = (stored: StoredAnswers) =>
      admin.health.read ? open(stored) : withoutHealth(open(stored), sensitive);
    const registrationAnswers = shownAnswers(registration);
    const participantAnswers = new Map(participants.map((participant) => [participant.id, shownAnswers(participant)]));
    const healthShown = [registrationAnswers, ...participantAnswers.values()].some((answers) =>
      Object.keys(answers).some((key) => sensitive.get(key) === 'health'),
    );
    const verifications = await this.verifications.listOf(participants.map(({ id }) => id));
    const answered = await this.registrations.listDeclarationAnswers(registrationId);
    const merged = answeredDefinition(version.definition, latest.definition);
    const guardians = await this.registrations.listGuardians(registrationId);
    const accessEmails = await this.registrations.listAccessEmails(registrationId);
    const undeliverable = await this.undeliverable.listMarked([
      ...guardians.map(({ email }) => email),
      ...accessEmails.map(({ email }) => email),
    ]);
    const rowsOf = (scope: FieldScope, answers: Answers) =>
      answerRows(scope, version.definition, latest.definition, published, answers).filter(
        ({ key }) => admin.health.read || sensitive.get(key) !== 'health',
      );
    const prihlasky = await this.files.links(
      participants.flatMap(({ prihlaskaFileId: id }) => (id === null ? [] : [id])),
    );

    if (healthShown) {
      await this.audit.record(admin.actor, {
        action: 'health_answers.view',
        target: { type: 'registration', id: registration.id },
      });
    }

    return {
      id: registration.id,
      variableSymbol: registration.variableSymbol,
      submittedAt: registration.submittedAt.toISOString(),
      source: registration.source,
      paymentChoice: registration.paymentChoice,
      formVersion: version.version,
      latestDefinition: latest.definition,
      camp: { id: camp.id, name: camp.name },
      turnus: { id: turnus.id, name: turnus.name, startDate: turnus.startDate, endDate: turnus.endDate },
      guardians: guardians.map((guardian, index) => ({
        position: index + 1,
        ...guardian,
        undeliverable: undeliverable.has(guardian.email),
      })),
      accessEmails: accessEmails.map((access) => ({ ...access, undeliverable: undeliverable.has(access.email) })),
      participants: participants.map((participant) => ({
        id: participant.id,
        position: participant.position,
        firstName: participant.firstName,
        lastName: participant.lastName,
        birthDate: participant.birthDate,
        ageOnStart: participant.birthDate === null ? null : ageOnStart(participant.birthDate, turnus.startDate),
        status: participant.status,
        prihlaska: participant.prihlaskaFileId === null ? null : (prihlasky.get(participant.prihlaskaFileId) ?? null),
        answers: rowsOf('participant', participantAnswers.get(participant.id) ?? {}),
      })),
      registrationAnswers: rowsOf('registration', registrationAnswers),
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
   * List the audit entries of a Registration and its Participants, newest first, each record named as it is
   * now; without the IP addresses, which only Owners see.
   * @param registrationId Registration id
   * @param healthRead whether the admin may read health data, and so its entries
   */
  public async history(registrationId: string, healthRead: boolean): Promise<HistoryEntry[]> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const participants = await this.registrations.listParticipants(registration.id);
    const entries = await this.readable.present(
      await this.auditEntries.listByTargets([registrationId, ...participants.map(({ id }) => id)]),
      healthRead,
    );

    return entries.map(({ ipAddress: _ipAddress, ...entry }) => entry);
  }

  /**
   * Confirm a Participant's Claimed discount after checking it, audited; confirming it again changes nothing.
   * @param admin who confirms it
   * @param registrationId Registration id
   * @param body the Participant and the answer
   * @throws {NotFoundException} claimed_discount_unknown when the Participant has no such Claimed discount
   * needing verification
   */
  public async verifyClaimedDiscount(
    admin: AdminAccess,
    registrationId: string,
    body: VerifyClaimedDiscountBody,
  ): Promise<RegistrationDetail> {
    const detail = await this.get(registrationId, { ...admin, health: { read: false, write: false } });
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
      await this.audit.record(admin.actor, {
        action: 'claimed_discount.verify',
        target: { type: 'participant', id: body.participantId },
        change: { before: null, after: { ...verification, label: discount.label, amount: discount.amount } },
      });
    }

    return this.get(registrationId, admin);
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

    const option = chosenOption(field, value);

    return {
      key: field.key,
      label: field.tier === 'custom' ? field.field.label : null,
      labelKey: field.tier === 'standard' ? field.labelKey : null,
      value: field.tier === 'custom' && value !== null ? withOptionLabels(field.field, value) : value,
      option: option === null ? null : { label: option.label, labelKey: option.labelKey },
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
        const standard = isRegistrationFieldKey(key) ? REGISTRATION_FIELD_CATALOGUE[key] : undefined;

        return {
          key,
          label: standard === undefined ? (field?.label ?? key) : null,
          labelKey: standard?.labelKey ?? null,
          value: field === undefined || value === null ? value : withOptionLabels(field, value),
          option: null,
          state: 'removed',
        };
      }),
  ];
}
