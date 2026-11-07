import { Injectable } from '@nestjs/common';

import { ageOnStart } from '@repo/schema/camps';
import type { ParticipantListQuery, ParticipantRow, SelectedTurnus } from '@repo/schema/registrations';

import { MembershipRepository } from '../../../../repositories/admins/membership/membership.repository.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { ClaimedDiscountVerificationRepository } from '../../../../repositories/registrations/claimed-discount-verification/claimed-discount-verification.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';
import { answeredDefinition, claimedDiscountsOf } from '../../payment/claimed-discounts.helper.ts';

/**
 * Write text as search compares it: lowercase, without diacritics.
 * @param text the text
 */
function searchable(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase();
}

// The admin's working list: one row per Participant of a Turnus, with the money of its Registration.
// Rows are built and searched in the API, a Turnus holding at most a few hundred children, so nothing
// encrypted is ever filtered or sorted in the database. Permission (Registrations read) is the route's.
@Injectable()
export class ParticipantListService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly ledger: LedgerService,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly memberships: MembershipRepository,
    private readonly verifications: ClaimedDiscountVerificationRepository,
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
   * List a Turnus's Participants by surname, searched and filtered.
   * @param turnusId Turnus id
   * @param query the search and filters
   */
  public async list(turnusId: string, query: ParticipantListQuery): Promise<ParticipantRow[]> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const registrations = await this.registrations.listByTurnus(turnusId);
    const ids = registrations.map(({ id }) => id);
    const participants = await this.registrations.listParticipantsOf(ids);
    const guardians = await this.registrations.listGuardiansOf(ids);
    const balances = await this.ledger.balancesOf(turnus, registrations);
    const versions = new Map(
      (await this.forms.listVersionsByIds([...new Set(registrations.map((r) => r.formVersionId))])).map((version) => [
        version.id,
        version,
      ]),
    );
    const byId = new Map(registrations.map((registration) => [registration.id, registration]));
    const verifications = await this.verifications.listOf(participants.map(({ id }) => id));
    const latestDefinition = (await this.forms.getLatestVersion(turnus.campId))?.definition;
    const words = searchable(query.search ?? '')
      .split(/\s+/)
      .filter((word) => word !== '');

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

      if (balance === undefined) {
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
          firstName: participant.firstName,
          lastName: participant.lastName,
          ageOnStart: ageOnStart(participant.birthDate, turnus.startDate),
          guardianName: `${guardian.firstName} ${guardian.lastName}`,
          guardianEmail: guardian.email,
          variableSymbol: registration.variableSymbol,
          paymentStatus: balance.status,
          amountDue: { amount: balance.amountDue.amount, dueDate: balance.amountDue.dueDate },
          overdue: balance.overdue,
          status: participant.status,
          unverifiedClaimedDiscount: claimed.some(({ verifiedAt }) => verifiedAt === null),
        },
      ];
    });
    return rows
      .filter(
        (row) =>
          (query.paymentStatus === undefined || row.paymentStatus === query.paymentStatus) &&
          (query.unverifiedClaimedDiscount !== true || row.unverifiedClaimedDiscount),
      )
      .sort(
        (one, other) =>
          one.lastName.localeCompare(other.lastName, 'cs') ||
          one.firstName.localeCompare(other.firstName, 'cs') ||
          one.participantId.localeCompare(other.participantId),
      );
  }
}
