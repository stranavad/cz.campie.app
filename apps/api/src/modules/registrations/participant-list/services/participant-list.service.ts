import { Injectable } from '@nestjs/common';

import { ageOnStart } from '@repo/schema/camps';
import type { ChecklistItem } from '@repo/schema/checklist';
import type { PaymentStatus } from '@repo/schema/pricing';
import type {
  ParticipantListQuery,
  ParticipantRow,
  RecentRegistration,
  SelectedTurnus,
  TurnusOverview,
} from '@repo/schema/registrations';

import { MembershipRepository } from '../../../../repositories/admins/membership/membership.repository.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { DocumentUploadRepository } from '../../../../repositories/documents/document-upload/document-upload.repository.ts';
import { UndeliverableEmailRepository } from '../../../../repositories/emails/undeliverable-email/undeliverable-email.repository.ts';
import { ClaimedDiscountVerificationRepository } from '../../../../repositories/registrations/claimed-discount-verification/claimed-discount-verification.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { ChecklistService } from '../../checklist/services/checklist.service.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';
import { answeredDefinition, claimedDiscountsOf } from '../../payment/claimed-discounts.helper.ts';

/**
 * Write text as search compares it: lowercase, without diacritics.
 * @param text the text
 */
function searchable(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase();
}

/**
 * Read from a child's checklist what the list shows and filters by. A Cancelled child has no checklist, so
 * no counts and no document status.
 * @param items the checklist's items, or undefined for a Cancelled child
 * @param modules the Camp's modules that report Consents and documents
 */
function signalsOf(
  items: readonly ChecklistItem[] | undefined,
  modules: { consents: boolean; documents: boolean },
): {
  shown: Pick<ParticipantRow, 'consents' | 'documents' | 'missingAnswers'>;
  unsignedConsent: boolean;
  missingDocument: boolean;
} {
  const consents = (items ?? []).filter(({ kind }) => kind === 'consent');
  const documents = (items ?? []).filter(({ kind }) => kind === 'document');
  const missingDocument = documents.some(({ state }) => state === 'missing' || state === 'returned');

  return {
    shown: {
      consents:
        items === undefined || !modules.consents
          ? null
          : { signed: consents.filter(({ done }) => done).length, required: consents.length },
      documents:
        items === undefined || !modules.documents
          ? null
          : missingDocument
            ? 'missing'
            : documents.some(({ state }) => state === 'pending')
              ? 'to_review'
              : 'complete',
      missingAnswers: (items ?? []).some(({ kind }) => kind === 'missing_answers'),
    },
    unsignedConsent: consents.some(({ done }) => !done),
    missingDocument,
  };
}

// How many of the newest Registrations the admin's overview shows.
const RECENT_REGISTRATIONS = 5;

// The admin's working list: one row per Participant of a Turnus, with the money of its Registration.
// Rows are built and searched in the API, a Turnus holding at most a few hundred children, so nothing
// encrypted is ever filtered or sorted in the database. Permission (Registrations read) is the route's.
@Injectable()
export class ParticipantListService {
  constructor(
    private readonly undeliverable: UndeliverableEmailRepository,
    private readonly registrations: RegistrationRepository,
    private readonly ledger: LedgerService,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly memberships: MembershipRepository,
    private readonly verifications: ClaimedDiscountVerificationRepository,
    private readonly checklists: ChecklistService,
    private readonly uploads: DocumentUploadRepository,
  ) {}

  /**
   * Get an admin's Selected Turnus in the current Organisation and the Turnusy to choose from; a removed
   * one reads as none.
   * @param adminId admin id
   */
  public async getSelected(adminId: string): Promise<SelectedTurnus> {
    const turnusy = await this.turnusy.list();
    const camps = new Map((await this.camps.list()).map((camp) => [camp.id, camp.name]));
    const selected = await this.memberships.getSelectedTurnusId(adminId);

    return {
      turnusId: turnusy.some(({ id }) => id === selected) ? selected : null,
      turnusy: turnusy.map(({ id, campId, name, startDate }) => ({
        id,
        name,
        startDate,
        campId,
        campName: camps.get(campId) ?? '',
      })),
    };
  }

  /**
   * Remember an admin's Selected Turnus in the current Organisation.
   * @param adminId admin id
   * @param turnusId Turnus id
   */
  public async select(adminId: string, turnusId: string): Promise<SelectedTurnus> {
    await this.turnusy.getByIdOrThrow(turnusId);
    await this.memberships.setSelectedTurnusId(adminId, turnusId);

    return this.getSelected(adminId);
  }

  /**
   * List the Organisation's newest Registrations across its Turnusy, with who they are for and how they
   * are paid; Erased ones are left out.
   */
  public async recent(): Promise<RecentRegistration[]> {
    const registrations = await this.registrations.listRecent(RECENT_REGISTRATIONS);
    const participants = await this.registrations.listParticipantsOf(registrations.map(({ id }) => id));
    const balances = await this.ledger.balancesOf(registrations);
    const turnusy = new Map((await this.turnusy.list()).map((turnus) => [turnus.id, turnus]));
    const camps = new Map((await this.camps.list()).map((camp) => [camp.id, camp]));

    return registrations.flatMap((registration) => {
      const turnus = turnusy.get(registration.turnusId);
      const camp = turnus === undefined ? undefined : camps.get(turnus.campId);
      const balance = balances.get(registration.id);

      if (turnus === undefined || camp === undefined || balance === undefined) {
        return [];
      }

      return [
        {
          id: registration.id,
          submittedAt: registration.submittedAt.toISOString(),
          source: registration.source,
          turnus: { id: turnus.id, name: turnus.name },
          camp: { id: camp.id, name: camp.name },
          participants: participants
            .filter(({ registrationId }) => registrationId === registration.id)
            .sort((one, other) => one.position - other.position)
            .map(({ firstName, lastName }) => ({ firstName, lastName })),
          paymentStatus: balance.status,
        },
      ];
    });
  }

  /**
   * List a Turnus's Participants by surname, searched and filtered.
   * @param turnusId Turnus id
   * @param query the search and filters
   */
  public async list(turnusId: string, query: ParticipantListQuery): Promise<ParticipantRow[]> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const modules = { consents: camp.modules.includes('consents'), documents: camp.modules.includes('documents') };
    const registrations = await this.registrations.listByTurnus(turnusId);
    const ids = registrations.map(({ id }) => id);
    const participants = await this.registrations.listParticipantsOf(ids);
    const guardians = await this.registrations.listGuardiansOf(ids);
    const undeliverable = await this.undeliverable.listMarked(
      [...guardians.values()].flatMap((named) => named.map(({ email }) => email)),
    );
    const balances = await this.ledger.balancesOf(registrations);
    const versions = new Map(
      (await this.forms.listVersionsByIds([...new Set(registrations.map((r) => r.formVersionId))])).map((version) => [
        version.id,
        version,
      ]),
    );
    const byId = new Map(registrations.map((registration) => [registration.id, registration]));
    const verifications = await this.verifications.listOf(participants.map(({ id }) => id));
    const latest = await this.forms.getLatestVersion(turnus.campId);
    const latestDefinition = latest?.definition;
    const words = searchable(query.search ?? '')
      .split(/\s+/)
      .filter((word) => word !== '');

    // Cancelled children have no checklist, so no checklist filter finds them.
    const checklistOf = new Map(
      (await this.checklists.ofLoaded({ turnus, registrations, participants, balances, versions, latest })).map(
        ({ participantId, items }) => [participantId, items],
      ),
    );
    const rows = participants.flatMap((participant): ParticipantRow[] => {
      const registration = byId.get(participant.registrationId);
      const named = guardians.get(participant.registrationId) ?? [];
      const [guardian] = named;
      const version = registration === undefined ? undefined : versions.get(registration.formVersionId);

      if (registration === undefined || guardian === undefined) {
        return [];
      }

      // Every word of the search appears somewhere: the child's or a guardian's name, an email, the symbol.
      const haystack = searchable(
        [
          participant.firstName,
          participant.lastName,
          ...named.flatMap(({ firstName, lastName, email }) => [firstName, lastName, email]),
          registration.variableSymbol,
        ].join(' '),
      );

      if (!words.every((word) => haystack.includes(word))) {
        return [];
      }

      const balance = balances.get(registration.id);
      const signals = signalsOf(checklistOf.get(participant.id), modules);

      if (
        balance === undefined ||
        (query.unsignedConsent === true && !signals.unsignedConsent) ||
        (query.missingDocument === true && !signals.missingDocument)
      ) {
        return [];
      }

      const claimed =
        version === undefined
          ? []
          : claimedDiscountsOf(
              answeredDefinition(version.definition, latestDefinition ?? version.definition),
              registration.answers,
              participant,
              verifications,
            );

      return [
        {
          participantId: participant.id,
          registrationId: registration.id,
          submittedAt: registration.submittedAt.toISOString(),
          firstName: participant.firstName,
          lastName: participant.lastName,
          ageOnStart: participant.birthDate === null ? 0 : ageOnStart(participant.birthDate, turnus.startDate),
          guardianName: `${guardian.firstName} ${guardian.lastName}`,
          guardianEmail: guardian.email,
          emailUndeliverable: named.some(({ email }) => undeliverable.has(email)),
          variableSymbol: registration.variableSymbol,
          paymentStatus: balance.status,
          amountDue: { amount: balance.amountDue.amount, dueDate: balance.amountDue.dueDate },
          overdue: balance.overdue,
          status: participant.status,
          unverifiedClaimedDiscount: claimed.some(({ verifiedAt }) => verifiedAt === null),
          ...signals.shown,
        },
      ];
    });
    return rows
      .filter(
        (row) =>
          (query.paymentStatus === undefined || row.paymentStatus === query.paymentStatus) &&
          (query.overdue !== true || row.overdue) &&
          (query.unverifiedClaimedDiscount !== true || row.unverifiedClaimedDiscount) &&
          (query.missingAnswers !== true || row.missingAnswers),
      )
      .sort(
        (one, other) =>
          one.lastName.localeCompare(other.lastName, 'cs') ||
          one.firstName.localeCompare(other.firstName, 'cs') ||
          one.participantId.localeCompare(other.participantId),
      );
  }

  /**
   * Show a Turnus at a glance: places taken, its money across every Registration, and the documents of
   * Registered children waiting for review.
   * @param turnusId Turnus id
   */
  public async overview(turnusId: string): Promise<TurnusOverview> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const registrations = await this.registrations.listByTurnus(turnusId);
    const participants = await this.registrations.listParticipantsOf(registrations.map(({ id }) => id));
    const registered = participants.filter(({ status }) => status === 'registered');
    const balances = [...(await this.ledger.balancesOf(registrations)).values()];
    const sum = (amounts: readonly number[]) => amounts.reduce((total, amount) => total + amount, 0);
    const registrationsByPaymentStatus: Record<PaymentStatus, number> = {
      unpaid: 0,
      partly_paid: 0,
      deposit_paid: 0,
      paid: 0,
      overpaid: 0,
    };

    for (const { status } of balances) {
      registrationsByPaymentStatus[status] += 1;
    }

    return {
      capacity: turnus.capacity,
      registered: registered.length,
      expected: sum(balances.map(({ total }) => total)),
      received: sum(balances.map(({ paid }) => paid)),
      outstanding: sum(balances.map(({ balance }) => Math.max(balance, 0))),
      overpaid: sum(balances.map(({ balance }) => Math.max(-balance, 0))),
      overdueRegistrations: balances.filter(({ overdue }) => overdue).length,
      registrationsByPaymentStatus,
      documentsToReview: camp.modules.includes('documents')
        ? await this.uploads.countPendingOf(registered.map(({ id }) => id))
        : 0,
    };
  }
}
