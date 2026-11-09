import { ConflictException, Injectable } from '@nestjs/common';

import {
  turnusAvailability,
  type PublicCampCard,
  type PublicTurnus,
  type RemoveTurnusErrorCode,
  type Turnus,
  type TurnusAvailability,
  type TurnusBody,
} from '@repo/schema/camps';
import { priceInForce } from '@repo/schema/pricing';
import { instantFromPragueLocal, pragueDateOf } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { violatedConstraint } from '../../../../core/database/constraint-violation.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { TurnusEntity } from '../../../../repositories/camps/turnus/turnus.entity.ts';
import { TurnusRepository, type TurnusFields } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';

// What a Camp's card on the landing page tells of its Turnusy.
export type TurnusySummary = Pick<PublicCampCard, 'dates' | 'lowestPrice'>;

// A Camp without Turnusy not yet over.
export const NO_TURNUSY: TurnusySummary = { dates: null, lowestPrice: null };

// The Turnusy of the current Organisation's Camps. Permission (Camp settings) is the route's.
@Injectable()
export class TurnusService {
  constructor(
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly registrations: RegistrationRepository,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * List a Camp's Turnusy by start date, each with its availability now.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<Turnus[]> {
    await this.camps.getByIdOrThrow(campId);

    return (await this.availabilityOf(await this.turnusy.listByCamp(campId))).map(
      ({ turnus, registered, availability }) => turnus.toDto(registered, availability),
    );
  }

  /**
   * List a Camp's Turnusy by start date as its public page shows them: availability, places left and the
   * price in force now.
   * @param campId Camp id
   */
  public async listPublic(campId: string): Promise<PublicTurnus[]> {
    const now = this.clock.now();

    return (await this.availabilityOf(await this.turnusy.listByCamp(campId))).map(
      ({ turnus, registered, availability }) => turnus.toPublicDto(registered, availability, now),
    );
  }

  /**
   * Sum up each of the current Organisation's Camps' Turnusy not yet over (ending today in Prague or
   * later): their first start and last end, and the lowest price in force now among those open or not yet
   * open. A Camp without any is missing from the map, its summary `NO_TURNUSY`.
   */
  public async summariseByCamp(): Promise<Map<string, TurnusySummary>> {
    const now = this.clock.now();
    const today = pragueDateOf(now);
    const summaries = new Map<string, TurnusySummary>();

    const notOver = (await this.turnusy.list()).filter(({ endDate }) => endDate >= today);

    for (const { turnus, availability } of await this.availabilityOf(notOver)) {
      const { dates, lowestPrice } = summaries.get(turnus.campId) ?? NO_TURNUSY;
      const price =
        availability === 'open' || availability === 'not_yet_open' ? priceInForce(turnus, now).amount : null;

      summaries.set(turnus.campId, {
        dates: {
          startDate: dates === null || turnus.startDate < dates.startDate ? turnus.startDate : dates.startDate,
          endDate: dates === null || turnus.endDate > dates.endDate ? turnus.endDate : dates.endDate,
        },
        lowestPrice: price === null ? lowestPrice : Math.min(price, lowestPrice ?? price),
      });
    }

    return summaries;
  }

  /**
   * Get a Turnus with its availability now.
   * @param id Turnus id
   */
  public async get(id: string): Promise<Turnus> {
    return this.withAvailability(await this.turnusy.getByIdOrThrow(id));
  }

  /**
   * Add a Turnus to a Camp of the current Organisation, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param body the Turnus
   */
  public async create(actor: Actor, campId: string, body: TurnusBody): Promise<Turnus> {
    await this.camps.getByIdOrThrow(campId);
    const turnus = await this.turnusy.create(campId, fieldsOf(body));

    await this.audit.record(actor, {
      action: 'turnus.create',
      target: { type: 'turnus', id: turnus.id },
      change: { before: null, after: turnus },
    });

    return this.withAvailability(turnus);
  }

  /**
   * Replace a Turnus's fields, audited with old and new values. Stored price lines of its Registrations
   * keep the prices they were submitted with.
   * @param actor who does it
   * @param id Turnus id
   * @param body the whole Turnus
   */
  public async update(actor: Actor, id: string, body: TurnusBody): Promise<Turnus> {
    const before = await this.turnusy.getByIdOrThrow(id);
    const after = await this.turnusy.update(id, fieldsOf(body));

    await this.audit.record(actor, {
      action: 'turnus.update',
      target: { type: 'turnus', id },
      change: { before, after },
    });

    return this.withAvailability(after);
  }

  /**
   * Remove a Turnus no Registration was submitted to, audited.
   * @param actor who does it
   * @param id Turnus id
   */
  public async remove(actor: Actor, id: string): Promise<void> {
    const removed = await this.removeUnregistered(id);

    await this.audit.record(actor, {
      action: 'turnus.remove',
      target: { type: 'turnus', id },
      change: { before: removed, after: null },
    });
  }

  /**
   * Remove a Turnus, unless Registrations hold it.
   * @param id Turnus id
   * @throws {ConflictException} turnus_has_registrations when a Registration was submitted to it
   */
  private async removeUnregistered(id: string): Promise<TurnusEntity> {
    try {
      return await this.turnusy.remove(id);
    } catch (error) {
      if (violatedConstraint(error, 'foreignKey') === 'registrations_turnusy_fkey') {
        const code: RemoveTurnusErrorCode = 'turnus_has_registrations';

        throw new ConflictException({ code, message: 'Registrations were submitted to the Turnus' });
      }

      throw error;
    }
  }

  /**
   * Show a Turnus with its availability by the Clock.
   * @param turnus the Turnus
   */
  private async withAvailability(turnus: TurnusEntity): Promise<Turnus> {
    const [shown] = await this.availabilityOf([turnus]);

    return turnus.toDto(shown?.registered ?? 0, shown?.availability ?? 'open');
  }

  /**
   * Count Turnusy's Registered Participants in one query and tell their availability by the Clock.
   * @param turnusy the Turnusy
   */
  private async availabilityOf(
    turnusy: readonly TurnusEntity[],
  ): Promise<{ turnus: TurnusEntity; registered: number; availability: TurnusAvailability }[]> {
    const counts = await this.registrations.countRegistered(turnusy.map(({ id }) => id));
    const now = this.clock.now();

    return turnusy.map((turnus) => {
      const registered = counts.get(turnus.id) ?? 0;

      return { turnus, registered, availability: turnusAvailability(turnus, registered, now) };
    });
  }
}

/**
 * Turn a Turnus as entered into its stored fields: the window's Prague times become instants.
 * @param body the Turnus
 */
function fieldsOf({ opensAt, closesAt, ...fields }: TurnusBody): TurnusFields {
  return {
    ...fields,
    opensAt: opensAt === null ? null : instantFromPragueLocal(opensAt),
    closesAt: closesAt === null ? null : instantFromPragueLocal(closesAt),
  };
}
