import { Injectable } from '@nestjs/common';

import { turnusAvailability, type PublicTurnus, type Turnus, type TurnusBody } from '@repo/schema/camps';
import { instantFromPragueLocal } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { TurnusEntity } from '../../../../repositories/camps/turnus/turnus.entity.ts';
import { TurnusRepository, type TurnusFields } from '../../../../repositories/camps/turnus/turnus.repository.ts';

// The Turnusy of the current Organisation's Camps. Permission (Camp settings) is the route's.
@Injectable()
export class TurnusService {
  constructor(
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * List a Camp's Turnusy by start date, each with its availability now.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<Turnus[]> {
    await this.camps.getByIdOrThrow(campId);

    return (await this.turnusy.listByCamp(campId)).map((turnus) => this.withAvailability(turnus));
  }

  /**
   * List a Camp's Turnusy by start date as its public page shows them: availability, places left and the
   * price in force now.
   * @param campId Camp id
   */
  public async listPublic(campId: string): Promise<PublicTurnus[]> {
    const now = this.clock.now();

    return (await this.turnusy.listByCamp(campId)).map((turnus) => {
      const registered = this.registeredIn(turnus);

      return turnus.toPublicDto(registered, turnusAvailability(turnus, registered, now), now);
    });
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
   * Remove a Turnus, audited.
   * @param actor who does it
   * @param id Turnus id
   */
  public async remove(actor: Actor, id: string): Promise<void> {
    const removed = await this.turnusy.remove(id);

    await this.audit.record(actor, {
      action: 'turnus.remove',
      target: { type: 'turnus', id },
      change: { before: removed, after: null },
    });
  }

  /**
   * Count a Turnus's Registered Participants. No Registrations exist yet, so none holds any.
   * @param _turnus the Turnus
   */
  private registeredIn(_turnus: TurnusEntity): number {
    return 0;
  }

  /**
   * Show a Turnus with its availability by the Clock.
   * @param turnus the Turnus
   */
  private withAvailability(turnus: TurnusEntity): Turnus {
    const registered = this.registeredIn(turnus);
    const availability = turnusAvailability(turnus, registered, this.clock.now());

    return turnus.toDto(registered, availability);
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
