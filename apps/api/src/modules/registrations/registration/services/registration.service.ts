import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ageProblem,
  REGISTRATION_FIELD_CATALOGUE,
  turnusAvailability,
  type TurnusAvailability,
} from '@repo/schema/camps';
import {
  checkSubmission,
  CORE_FIELDS,
  surchargesOf,
  type Answers,
  type CoreFieldKey,
  type Submission,
} from '@repo/schema/form-engine';
import { priceRegistration, type RegistrationPrice } from '@repo/schema/pricing';
import type {
  SubmissionErrorCode,
  SubmissionFieldErrorCode,
  SubmitRegistrationBody,
  SubmittedRegistration,
} from '@repo/schema/registrations';
import type { FieldError } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { lockTimedOut } from '../../../../core/database/lock-timeout.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { DiscountCodeEntity } from '../../../../repositories/camps/discount-code/discount-code.entity.ts';
import type { RegistrationFormVersionEntity } from '../../../../repositories/camps/registration-form/registration-form.entity.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import type { TurnusEntity } from '../../../../repositories/camps/turnus/turnus.entity.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import {
  RegistrationRepository,
  type CreateRegistration,
  type GuardianFields,
  type ParticipantFields,
} from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { DiscountCodeService } from '../../../camps/discount-code/services/discount-code.service.ts';
import { generatePrihlaskyJob } from '../../prihlaska/generate-prihlasky.job.ts';
import { notifyTeamJob } from '../notify-team.job.ts';
import { VariableSymbols } from './variable-symbols.ts';

// A clash of eight random digits among an Organisation's Registrations is rare; this many in a row means
// something else is wrong.
const VARIABLE_SYMBOL_ATTEMPTS = 10;

// What the error response carries at most, as its schema allows.
const MAX_FIELD_ERRORS = 500;

const CORE_KEYS: ReadonlySet<string> = new Set(CORE_FIELDS.map(({ key }) => key));

const REFUSED_AVAILABILITY: Readonly<Record<Exclude<TurnusAvailability, 'open'>, SubmissionErrorCode>> = {
  not_yet_open: 'turnus_not_yet_open',
  closed_by_window: 'turnus_window_closed',
  closed_manually: 'turnus_closed_manually',
  full: 'turnus_full',
};

interface Place {
  readonly camp: CampEntity;
  readonly form: RegistrationFormVersionEntity;
  readonly turnus: TurnusEntity;
}

/**
 * Refuse a submission with the reasons at its fields, as many as the error response carries.
 * @param errors the reasons
 */
function invalid(errors: readonly FieldError[]): BadRequestException {
  const code: SubmissionErrorCode = 'submission_invalid';

  return new BadRequestException({
    code,
    message: 'The submission does not fit the form',
    fields: errors.slice(0, MAX_FIELD_ERRORS),
  });
}

// Registrations: the public submission that places children in a Turnus.
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);
  private readonly limit: RequestLimit;

  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly camps: CampRepository,
    private readonly turnusy: TurnusRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly discountCodes: DiscountCodeService,
    private readonly campEmails: CampEmailService,
    private readonly variableSymbols: VariableSymbols,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    private readonly jobs: JobQueue,
    private readonly audit: AuditService,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).submission;
  }

  /**
   * Submit a Registration to a Turnus of a Camp under its latest published form, taking the children's
   * places. The answers, age limits, declarations and code are checked again first, without locks; then
   * the Turnus row stays locked until the unit of work ends, so placements in it run one at a time, and
   * the code's row too, so its limit holds. A second submission with the same idempotency key returns the
   * first Registration. Counts against the submission limit of the address, and of the Organisation once
   * the answers check out, so a flood of nonsense cannot lock the Organisation's families out.
   * @param slug the Camp's slug or a former one
   * @param body the Turnus, the answers, the payment choice, the code and the declarations
   * @param ipAddress where the request comes from
   * @throws {BadRequestException} submission_invalid with the reasons in `fields`
   */
  public async submit(slug: string, body: SubmitRegistrationBody, ipAddress: string): Promise<SubmittedRegistration> {
    await this.rateLimiter.admitAddress(this.limit, ipAddress);
    await this.registrations.lockIdempotencyKey(body.idempotencyKey);
    const earlier = await this.registrations.getByIdempotencyKey(body.idempotencyKey);

    if (earlier !== null) {
      return this.replay(earlier, body.turnusId);
    }

    const now = this.clock.now();
    const { camp, form, turnus } = await this.placeOf(slug, body.turnusId);
    await this.ensureRoom(turnus, body.submission.participants.length, now);
    const { submission, errors } = this.checkAnswers(form, turnus, body);

    if (errors.length > 0) {
      const code = await this.discountCodeOf(camp.id, body.discountCode, 'check');

      throw invalid(code.error === null ? errors : [...errors, code.error]);
    }

    await this.rateLimiter.admitTarget(this.limit, this.unitOfWork.organisationId);
    const locked = await this.lockTurnus(turnus.id);
    await this.ensureRoom(locked, submission.participants.length, now);
    const { code, error } = await this.discountCodeOf(camp.id, body.discountCode, 'use');

    if (error !== null) {
      throw invalid([error]);
    }

    const price = priceRegistration({
      priceList: locked,
      siblingDiscount: camp.toSiblingDiscount(),
      participants: surchargesOf(form.definition, submission),
      discountCode: code?.toPricing() ?? null,
      paymentChoice: body.paymentChoice,
      submittedAt: now,
    });

    return this.store({ form, turnus: locked }, body, { submission, price, code, now, ipAddress });
  }

  /**
   * Tell a Camp's team of a new Registration, by its notification email.
   * @param registrationId Registration id
   */
  public async notifyTeam(registrationId: string): Promise<void> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const children = await this.registrations.listParticipants(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);

    await this.campEmails.send(turnus.campId, 'new_registration_notification', {
      values: {
        deti: children.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', '),
        turnus: turnus.name,
        variabilni_symbol: registration.variableSymbol,
      },
      to: [],
    });
  }

  /**
   * Answer a repeated submission with the Registration its idempotency key created.
   * @param earlier the Registration
   * @param turnusId the Turnus the repeat names
   * @throws {ConflictException} idempotency_key_reused when the key created a Registration in another Turnus
   */
  private async replay(earlier: RegistrationEntity, turnusId: string): Promise<SubmittedRegistration> {
    if (earlier.turnusId !== turnusId) {
      const code: SubmissionErrorCode = 'idempotency_key_reused';

      throw new ConflictException({ code, message: 'The key created a Registration in another Turnus' });
    }

    return {
      id: earlier.id,
      variableSymbol: earlier.variableSymbol,
      total: await this.registrations.totalOf(earlier.id),
      depositTotal: earlier.depositTotal,
    };
  }

  /**
   * Find the Camp by its slug, its latest published form, and its Turnus.
   * @param slug the Camp's slug or a former one
   * @param turnusId Turnus id
   * @throws {NotFoundException} when the Camp is unknown, has no published form, or the Turnus is not its
   */
  private async placeOf(slug: string, turnusId: string): Promise<Place> {
    const camp = await this.camps.getBySlug(slug.toLowerCase());
    const form = camp === null ? null : await this.forms.getLatestVersion(camp.id);
    const turnus = camp === null ? null : await this.turnusy.getById(turnusId);

    if (camp === null || form === null || turnus === null || turnus.campId !== camp.id) {
      throw new NotFoundException();
    }

    return { camp, form, turnus };
  }

  /**
   * Lock a Turnus for a placement, as it is now.
   * @param id Turnus id
   * @throws {ServiceUnavailableException} turnus_busy when other placements held it for too long
   * @throws {NotFoundException} when it was removed meanwhile
   */
  private async lockTurnus(id: string): Promise<TurnusEntity> {
    let turnus: TurnusEntity | null;

    try {
      turnus = await this.turnusy.lockById(id);
    } catch (error) {
      if (lockTimedOut(error)) {
        const code: SubmissionErrorCode = 'turnus_busy';

        throw new ServiceUnavailableException({ code, message: 'Too many placements at once, try again' });
      }

      throw error;
    }

    if (turnus === null) {
      throw new NotFoundException();
    }

    return turnus;
  }

  /**
   * Make sure a Turnus takes Registrations now and has a place for every child.
   * @param turnus the Turnus
   * @param children how many children the submission places
   * @param now the submission's instant
   * @throws {ConflictException} turnus_not_yet_open, turnus_window_closed, turnus_closed_manually or turnus_full
   */
  private async ensureRoom(turnus: TurnusEntity, children: number, now: Date): Promise<void> {
    const registered = (await this.registrations.countRegistered([turnus.id])).get(turnus.id) ?? 0;
    const availability = turnusAvailability(turnus, registered, now);

    if (availability !== 'open' || registered + children > turnus.capacity) {
      const code: SubmissionErrorCode = availability === 'open' ? 'turnus_full' : REFUSED_AVAILABILITY[availability];

      throw new ConflictException({ code, message: 'The Turnus takes no more Registrations' });
    }
  }

  /**
   * Check the answers against the form, the Camp's limit of children, the Turnus's age limits and the
   * mandatory declarations.
   * @param form the latest published form
   * @param turnus the Turnus
   * @param body the submission
   */
  private checkAnswers(
    form: RegistrationFormVersionEntity,
    turnus: TurnusEntity,
    body: SubmitRegistrationBody,
  ): { submission: Submission; errors: FieldError[] } {
    const { value, errors: formErrors } = checkSubmission(
      form.definition,
      REGISTRATION_FIELD_CATALOGUE,
      body.submission,
    );
    const errors: FieldError[] = formErrors.map(({ path, code, params }) => ({ path: [...path], code, params }));
    const field = (path: (string | number)[], code: SubmissionFieldErrorCode, params?: Record<string, number>) =>
      errors.push({ path, code, ...(params === undefined ? {} : { params }) });

    if (value.participants.length > form.maxParticipants) {
      field(['participants'], 'participants_too_many', { max: form.maxParticipants });
    }

    value.participants.forEach((answers, index) => {
      const birthDate = answers.birthDate;
      const problem = typeof birthDate === 'string' ? ageProblem(birthDate, turnus) : null;

      if (problem === 'too_young' && turnus.minAge !== null) {
        field(['participants', index, 'birthDate'], 'participant_too_young', { min: turnus.minAge });
      } else if (problem === 'too_old' && turnus.maxAge !== null) {
        field(['participants', index, 'birthDate'], 'participant_too_old', { max: turnus.maxAge });
      }
    });

    for (const declaration of form.declarations) {
      if (declaration.mandatory && !accepted(body, declaration.id)) {
        field(['declarations', declaration.id], 'declaration_required');
      }
    }

    return { submission: value, errors };
  }

  /**
   * Find the code a guardian typed, or why it cannot be used now, at the code field. To take a use, the
   * code stays locked until the unit of work ends.
   * @param campId Camp id
   * @param text the code as typed, or nothing
   * @param purpose `check` to only tell, `use` to take a use next
   */
  private async discountCodeOf(
    campId: string,
    text: string | null,
    purpose: 'check' | 'use',
  ): Promise<{ code: DiscountCodeEntity | null; error: FieldError | null }> {
    if (text === null || text.trim() === '') {
      return { code: null, error: null };
    }

    const { code, status } =
      purpose === 'use'
        ? await this.discountCodes.checkForUse(campId, text)
        : await this.discountCodes.check(campId, text);

    if (code !== null && status === 'valid') {
      return { code, error: null };
    }

    const reason: SubmissionFieldErrorCode = status === 'valid' ? 'discount_code_unknown' : `discount_code_${status}`;

    return { code: null, error: { path: ['discountCode'], code: reason } };
  }

  /**
   * Store a checked and priced submission: the Registration under a free Variable symbol, its guardians,
   * Participants, price lines, code use and declaration answers; audit it and enqueue what follows.
   * @param place the form and the Turnus, locked
   * @param body the submission
   * @param checked the checked answers, the price, the code, the instant and the address
   */
  private async store(
    { form, turnus }: Omit<Place, 'camp'>,
    body: SubmitRegistrationBody,
    checked: {
      submission: Submission;
      price: RegistrationPrice;
      code: DiscountCodeEntity | null;
      now: Date;
      ipAddress: string;
    },
  ): Promise<SubmittedRegistration> {
    const { submission, price, code, now, ipAddress } = checked;
    const registration = await this.createWithVariableSymbol({
      turnusId: turnus.id,
      formVersionId: form.id,
      idempotencyKey: body.idempotencyKey,
      paymentChoice: price.depositTotal === null ? 'full' : 'deposit',
      depositTotal: price.depositTotal,
      answers: withoutCore(submission.registration),
      submittedAt: now,
    });
    const guardians = guardiansOf(submission.registration);
    const children = submission.participants.map(participantOf);
    const declarations = form.declarations.map(({ id }) => ({
      declarationId: id,
      accepted: accepted(body, id),
      answeredAt: now,
      ipAddress,
    }));

    await this.registrations.addGuardians(registration.id, guardians);
    const participants = await this.registrations.addParticipants(registration.id, children);
    await this.registrations.addPriceLines(
      registration.id,
      price.lines,
      participants.map(({ id }) => id),
    );
    await this.registrations.addDeclarationAnswers(registration.id, declarations);

    if (code !== null) {
      await this.discountCodes.recordUse(code.id, registration.id, now);
    }

    const actor: Actor = {
      kind: 'guardian',
      identity: requiredTextOf(submission.registration, 'guardianEmail'),
      ipAddress,
    };
    // What was submitted, as the history shows it; the address is the entry's own, not repeated inside.
    await this.audit.record(actor, {
      action: 'registration.submit',
      target: { type: 'registration', id: registration.id },
      change: {
        before: null,
        after: {
          variableSymbol: registration.variableSymbol,
          turnusId: registration.turnusId,
          paymentChoice: registration.paymentChoice,
          depositTotal: registration.depositTotal,
          guardians,
          participants: children.map(({ firstName, lastName, birthDate }) => ({ firstName, lastName, birthDate })),
          priceLines: price.lines,
          declarations: declarations.map(({ declarationId, accepted: ticked }) => ({
            declarationId,
            accepted: ticked,
          })),
        },
      },
    });
    this.jobs.enqueue(generatePrihlaskyJob, { registrationId: registration.id });
    this.jobs.enqueue(notifyTeamJob, { registrationId: registration.id });

    return {
      id: registration.id,
      variableSymbol: registration.variableSymbol,
      total: price.total,
      depositTotal: registration.depositTotal,
    };
  }

  /**
   * Create a Registration under a Variable symbol no other of the Organisation has, drawing again on a clash.
   * @param input the Registration without its Variable symbol
   * @throws {Error} when every attempt clashed
   */
  private async createWithVariableSymbol(
    input: Omit<CreateRegistration, 'variableSymbol'>,
  ): Promise<RegistrationEntity> {
    for (let attempt = 1; attempt <= VARIABLE_SYMBOL_ATTEMPTS; attempt++) {
      const created = await this.registrations.create({
        ...input,
        variableSymbol: this.variableSymbols.draw(input.submittedAt),
      });

      if (created !== null) {
        return created;
      }

      this.logger.warn(`Variable symbol clash in Organisation ${this.unitOfWork.organisationId}, attempt ${attempt}`);
    }

    throw new Error('No free Variable symbol was drawn');
  }
}

/**
 * Tell whether the guardian ticked a declaration.
 * @param body the submission
 * @param declarationId the declaration
 */
function accepted(body: SubmitRegistrationBody, declarationId: string): boolean {
  return body.declarations.some(({ id, accepted: ticked }) => id === declarationId && ticked);
}

/**
 * Keep the answers that are not core fields, which are stored as columns.
 * @param answers checked answers of one scope
 */
function withoutCore(answers: Answers): Answers {
  return Object.fromEntries(Object.entries(answers).filter(([key]) => !CORE_KEYS.has(key)));
}

/**
 * Read a core text answer, present after the check when given.
 * @param answers checked answers
 * @param key the core field
 */
function textOf(answers: Answers, key: CoreFieldKey): string | null {
  const value = answers[key];

  return typeof value === 'string' ? value : null;
}

/**
 * Read a required core text answer, which the check guarantees.
 * @param answers checked answers
 * @param key the core field
 * @throws {Error} when it is missing, which a checked submission never is
 */
function requiredTextOf(answers: Answers, key: CoreFieldKey): string {
  const value = textOf(answers, key);

  if (value === null) {
    throw new Error(`The checked submission has no ${key}`);
  }

  return value;
}

/**
 * Read the guardians from the per-Registration answers: the first, and the second when named.
 * @param answers the checked per-Registration answers
 */
function guardiansOf(answers: Answers): GuardianFields[] {
  const first: GuardianFields = {
    firstName: requiredTextOf(answers, 'guardianFirstName'),
    lastName: requiredTextOf(answers, 'guardianLastName'),
    email: requiredTextOf(answers, 'guardianEmail'),
    phone: textOf(answers, 'guardianPhone'),
  };
  const secondEmail = textOf(answers, 'secondGuardianEmail');

  return secondEmail === null
    ? [first]
    : [
        first,
        {
          firstName: requiredTextOf(answers, 'secondGuardianFirstName'),
          lastName: requiredTextOf(answers, 'secondGuardianLastName'),
          email: secondEmail,
          phone: textOf(answers, 'secondGuardianPhone'),
        },
      ];
}

/**
 * Read a child from its checked answers: the core as columns, the rest as answers.
 * @param answers the child's checked answers
 */
function participantOf(answers: Answers): ParticipantFields {
  return {
    firstName: requiredTextOf(answers, 'firstName'),
    lastName: requiredTextOf(answers, 'lastName'),
    birthDate: requiredTextOf(answers, 'birthDate'),
    answers: withoutCore(answers),
  };
}
