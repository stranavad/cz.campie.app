import { Injectable } from '@nestjs/common';

import { slugify } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { CampEntity } from '../../../../repositories/camps/camp/camp.entity.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';

// The slug of a name with nothing a slug can hold.
const FALLBACK_SLUG = 'tabor';

@Injectable()
export class CampService {
  constructor(
    private readonly camps: CampRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create the first Camp of the current Organisation, its slug taken from its name, audited.
   * @param actor who does it
   * @param input the Camp's name
   */
  public async createFirst(actor: Actor, { name }: { name: string }): Promise<CampEntity> {
    const camp = await this.camps.create({ name, slug: slugify(name) || FALLBACK_SLUG });

    await this.audit.record(actor, {
      action: 'camp.create',
      target: { type: 'camp', id: camp.id },
      change: { before: null, after: camp },
    });

    return camp;
  }
}
