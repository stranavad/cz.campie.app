import { Injectable, NotFoundException } from '@nestjs/common';

import type { GuardianRegistration } from '@repo/schema/portal';

import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';

// A guardian's Registrations in the portal. Access follows the guardian emails on each Registration at the
// time of the request, so removing an email takes access away at once.
@Injectable()
export class GuardianRegistrationService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
  ) {}

  /**
   * List the Registrations of the current Organisation that name a guardian, newest first.
   * @param email the signed-in guardian's email
   */
  public async list(email: string): Promise<GuardianRegistration[]> {
    const registrations = await this.registrations.listByGuardian(email);

    return Promise.all(registrations.map((registration) => this.show(registration)));
  }

  /**
   * Get one Registration that names a guardian.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when no Registration of the Organisation with this id names the guardian
   */
  public async get(email: string, registrationId: string): Promise<GuardianRegistration> {
    const registration = await this.registrations.getByGuardian(email, registrationId);

    if (registration === null) {
      throw new NotFoundException();
    }

    return this.show(registration);
  }

  /**
   * Show a Registration as the portal lists it.
   * @param registration the Registration
   */
  private async show(registration: RegistrationEntity): Promise<GuardianRegistration> {
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const participants = await this.registrations.listParticipants(registration.id);

    return {
      id: registration.id,
      variableSymbol: registration.variableSymbol,
      campName: camp.name,
      turnusName: turnus.name,
      participants: participants.map(({ firstName, lastName }) => ({ firstName, lastName })),
    };
  }
}
