import { Injectable } from '@nestjs/common';

import type { Answers, AnswerValue, CustomField, FieldScope, FormDefinition } from '@repo/schema/form-engine';
import { czechDate, czechDateTime } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { DocumentService, type DocumentBranding } from '../../../../core/documents/document.service.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import type { ParticipantEntity } from '../../../../repositories/registrations/participant/participant.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { effectiveBranding } from '../../../camps/camp-branding/services/camp-branding.service.ts';
import { qrPlatbaSvg, registrationPaymentOf } from '../../payment/payment-instructions.helper.ts';
import {
  PrihlaskaDocument,
  type PrihlaskaPayment,
  type PrihlaskaProps,
  type PrihlaskaRow,
} from '../prihlaska.document.tsx';

// What one page has room for: longer labels and answers are cut.
const MAX_LABEL = 80;
const MAX_VALUE = 160;
const MAX_DECLARATION = 140;

// What every Přihláška of a Registration shows; each Participant's adds its own answers.
interface PrihlaskaBasis {
  readonly shared: Omit<PrihlaskaProps, 'participant' | 'otherParticipants'>;
  readonly definition: FormDefinition;
  readonly participants: readonly ParticipantEntity[];
  readonly variableSymbol: string;
  readonly branding: DocumentBranding;
}

// The Přihláška PDF of each Participant: generated after submission and again on an admin's request, stored
// encrypted, and pointed to by the Participant.
@Injectable()
export class PrihlaskaService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly organisations: OrganisationRepository,
    private readonly documents: DocumentService,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Generate the Přihláška of every Participant of a new Registration that has none yet, so a job run
   * again after it succeeded changes nothing.
   * @param actor who asks, the system after a submission
   * @param registrationId Registration id
   * @returns whether any was generated
   */
  public async generateMissing(actor: Actor, registrationId: string): Promise<boolean> {
    const basis = await this.basisOf(registrationId);
    const missing = basis.participants.filter(({ prihlaskaFileId }) => prihlaskaFileId === null);

    for (const participant of missing) {
      await this.generateFor(actor, basis, participant.id);
    }

    return missing.length > 0;
  }

  /**
   * Generate one Participant's Přihláška again, as after a correction, replacing the earlier one. Renders,
   * so call it from a job.
   * @param actor who asks
   * @param participantId Participant id
   */
  public async regenerate(actor: Actor, participantId: string): Promise<void> {
    const participant = await this.registrations.getParticipantOrThrow(participantId);

    await this.generateFor(actor, await this.basisOf(participant.registrationId), participantId);
  }

  /**
   * Render and store one Participant's Přihláška, point the Participant to it and remove the earlier one,
   * audited. It renders before taking any lock, so a slow renderer never holds up the Registration's
   * payments, signatures or uploads; under the locks it renders again only when the child changed meanwhile.
   * The Participant stays locked to the end, so two generations never both remove the same file.
   * @param actor who asks
   * @param basis what the Registration's Přihlášky show
   * @param participantId Participant id
   */
  private async generateFor(actor: Actor, basis: PrihlaskaBasis, participantId: string): Promise<void> {
    const before = await this.registrations.getParticipantOrThrow(participantId);
    const propsOf = (participant: typeof before): PrihlaskaProps => ({
      ...basis.shared,
      participant: {
        name: `${participant.firstName} ${participant.lastName}`,
        birthDate: participant.birthDate === null ? '-' : czechDate(participant.birthDate),
        answers: rowsOf(basis.definition, 'participant', participant.answers),
      },
      otherParticipants: basis.participants
        .filter(({ id }) => id !== participant.id)
        .map(({ firstName, lastName }) => `${firstName} ${lastName}`),
    });
    const rendered = await this.documents.render(PrihlaskaDocument, propsOf(before), basis.branding);

    // The Registration's lock keeps an erasure out until this commits; one that came first leaves nothing
    // to print.
    if ((await this.registrations.lockById(before.registrationId))?.erasedAt !== null) {
      return;
    }

    const participant = await this.registrations.lockParticipantOrThrow(participantId);
    const props = propsOf(participant);
    const bytes =
      JSON.stringify(props) === JSON.stringify(propsOf(before))
        ? rendered
        : await this.documents.render(PrihlaskaDocument, props, basis.branding);
    const fileId = await this.files.store({
      name: `prihlaska-${basis.variableSymbol}-${participant.position + 1}.pdf`,
      bytes,
    });

    await this.registrations.setPrihlaska(participant.id, fileId);

    if (participant.prihlaskaFileId !== null) {
      await this.files.remove(participant.prihlaskaFileId);
    }

    await this.audit.record(actor, {
      action: 'participant.generate_prihlaska',
      target: { type: 'participant', id: participant.id },
      change: { before: { prihlaskaFileId: participant.prihlaskaFileId }, after: { prihlaskaFileId: fileId } },
    });
  }

  /**
   * Gather what a Registration's Přihlášky show as it was submitted: the form version's labels, the frozen
   * price lines, and the payment owed first with its QR platba.
   * @param registrationId Registration id
   */
  private async basisOf(registrationId: string): Promise<PrihlaskaBasis> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const participants = await this.registrations.listParticipants(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const form = await this.forms.getVersionByIdOrThrow(registration.formVersionId);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const guardians = await this.registrations.listGuardians(registrationId);
    const lines = await this.registrations.listPriceLines(registrationId);
    const answered = await this.registrations.listDeclarationAnswers(registrationId);

    const total = lines.reduce((sum, { amount }) => sum + amount, 0);
    // A snapshot of the submission: nothing paid yet, whatever was paid since.
    const instructions = registrationPaymentOf({ registration, turnus, camp, organisation, total, paid: 0 });
    const payment: PrihlaskaPayment = {
      ...instructions,
      dueDate: optionalDate(instructions.dueDate),
      balance:
        instructions.balance === null
          ? null
          : { ...instructions.balance, dueDate: optionalDate(instructions.balance.dueDate) },
      qrSvg: instructions.qrPlatba === null ? null : await qrPlatbaSvg(instructions.qrPlatba),
    };
    const nameOf = (position: number | null) => {
      const named = participants.find((participant) => participant.position === position);

      return named === undefined ? null : `${named.firstName} ${named.lastName}`;
    };

    return {
      shared: {
        campName: camp.name,
        turnus: {
          name: turnus.name,
          dates: `${czechDate(turnus.startDate)} - ${czechDate(turnus.endDate)}`,
          place: turnus.place,
        },
        submittedAt: czechDateTime(registration.submittedAt),
        guardians: guardians.map(({ firstName, lastName, email, phone }) => ({
          name: `${firstName} ${lastName}`,
          email,
          phone,
        })),
        registrationAnswers: rowsOf(form.definition, 'registration', registration.answers),
        lines: lines.map(({ kind, label, participant, amount }) => ({
          kind,
          label,
          participant: nameOf(participant),
          amount,
        })),
        total,
        payment,
        declarations: form.declarations.map(({ id, text }) => ({
          text: cut(text, MAX_DECLARATION),
          accepted: answered.some((answer) => answer.declarationId === id && answer.accepted),
        })),
      },
      definition: form.definition,
      participants,
      variableSymbol: registration.variableSymbol,
      branding: { displayName: camp.name, ...effectiveBranding(camp, organisation) },
    };
  }
}

/**
 * List the custom questions of a scope a child or the Registration answered, with the labels of the form
 * version it was submitted under.
 * @param definition the form version's definition
 * @param scope per child or per Registration
 * @param answers the stored answers
 */
function rowsOf(definition: FormDefinition, scope: FieldScope, answers: Answers): PrihlaskaRow[] {
  return definition.custom
    .filter((field) => field.scope === scope)
    .flatMap((field) => {
      const value = shown(field, answers[field.id]);

      return value === null ? [] : [{ label: cut(field.label, MAX_LABEL), value: cut(value, MAX_VALUE) }];
    });
}

/**
 * Write an answer as the form offered it: options by their labels, yes or no in words, dates the Czech way.
 * @param field the custom field
 * @param value the stored answer
 */
function shown(field: CustomField, value: AnswerValue | undefined): string | null {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  switch (field.type) {
    case 'yes_no':
      return value === true ? 'Ano' : 'Ne';
    case 'single_choice':
    case 'multiple_choice': {
      const chosen = Array.isArray(value) ? value : [String(value)];

      return chosen.map((id) => field.options.find((option) => option.id === id)?.label ?? id).join(', ');
    }
    case 'date':
      return typeof value === 'string' ? czechDate(value) : null;
    case 'short_text':
    case 'long_text':
    case 'number':
      return String(value);
  }
}

/**
 * Cut text to a length, marking the cut.
 * @param text the text
 * @param max the most characters
 */
function cut(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * Write a date the Czech way, if there is one.
 * @param date YYYY-MM-DD, or null
 */
function optionalDate(date: string | null): string | null {
  return date === null ? null : czechDate(date);
}
