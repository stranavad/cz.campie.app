import { Injectable } from '@nestjs/common';

import type { GetSetupProgressResponse } from '@repo/schema/organisations';

import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';

interface CampProgress {
  readonly campId: string;
  readonly turnus: boolean;
  readonly registrationForm: boolean;
}

const stepsDone = ({ turnus, registrationForm }: CampProgress) => Number(turnus) + Number(registrationForm);

// What the current Organisation still lacks before its first Registration, read from what exists.
@Injectable()
export class SetupProgressService {
  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly camps: CampRepository,
    private readonly turnusy: TurnusRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Tell which setup steps the current Organisation has done, the Camp's steps for its Camp closest to
   * taking Registrations.
   */
  public async get(): Promise<GetSetupProgressResponse> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const withTurnus = new Set((await this.turnusy.list()).map(({ campId }) => campId));
    const camps: CampProgress[] = [];

    // One Camp after another: the unit of work's transaction runs one query at a time anyway.
    for (const { id } of await this.camps.list()) {
      camps.push({
        campId: id,
        turnus: withTurnus.has(id),
        registrationForm: (await this.forms.getLatestVersion(id)) !== null,
      });
    }

    // Ids are UUIDv7, so among Camps equally far the oldest comes first.
    const [closest] = camps.toSorted((a, b) => stepsDone(b) - stepsDone(a) || (a.campId < b.campId ? -1 : 1));

    return {
      bankAccount: organisation.bankAccount !== null,
      ...(closest ?? { campId: null, turnus: false, registrationForm: false }),
    };
  }
}
