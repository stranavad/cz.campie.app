import { ConflictException, Injectable } from '@nestjs/common';

import {
  discountCodeStatus,
  type CreateDiscountCodeBody,
  type DiscountCodeErrorCode,
  type DiscountCodeResource,
  type DiscountCodeStatus,
  type UpdateDiscountCodeBody,
} from '@repo/schema/camps';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { violatedConstraint } from '../../../../core/database/constraint-violation.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { DiscountCodeEntity } from '../../../../repositories/camps/discount-code/discount-code.entity.ts';
import { DiscountCodeRepository } from '../../../../repositories/camps/discount-code/discount-code.repository.ts';

// The Discount codes of the current Organisation's Camps. Permission (Camp settings) is the route's.
@Injectable()
export class DiscountCodeService {
  constructor(
    private readonly discountCodes: DiscountCodeRepository,
    private readonly camps: CampRepository,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * List a Camp's Discount codes, each with its recorded uses and its status now.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<DiscountCodeResource[]> {
    await this.camps.getByIdOrThrow(campId);
    const codes = await this.discountCodes.listByCamp(campId);
    const uses = await this.discountCodes.countUses(codes.map(({ id }) => id));

    return codes.map((code) => this.withStatus(code, uses.get(code.id) ?? 0));
  }

  /**
   * Add a Discount code to a Camp of the current Organisation, switched on, audited.
   * @param actor who does it
   * @param campId Camp id
   * @param body the code
   * @throws {ConflictException} discount_code_taken when the Camp has the code in any case
   */
  public async create(actor: Actor, campId: string, body: CreateDiscountCodeBody): Promise<DiscountCodeResource> {
    await this.camps.getByIdOrThrow(campId);
    const code = await this.insert(campId, body);

    await this.audit.record(actor, {
      action: 'discount_code.create',
      target: { type: 'discount_code', id: code.id },
      change: { before: null, after: code },
    });

    return this.withStatus(code, 0);
  }

  /**
   * Switch a Discount code on or off, or change its limit or expiry, audited.
   * @param actor who does it
   * @param id Discount code id
   * @param body the fields to change
   */
  public async update(actor: Actor, id: string, body: UpdateDiscountCodeBody): Promise<DiscountCodeResource> {
    const before = await this.discountCodes.getByIdOrThrow(id);
    const after = await this.discountCodes.update(id, body);

    await this.audit.record(actor, {
      action: 'discount_code.update',
      target: { type: 'discount_code', id },
      change: { before, after },
    });

    return this.withStatus(after, (await this.discountCodes.countUses([id])).get(id) ?? 0);
  }

  /**
   * Remove a Discount code no Registration has used, audited; a used one stays as the record of its uses.
   * @param actor who does it
   * @param id Discount code id
   * @throws {ConflictException} discount_code_used when a Registration has used it
   */
  public async remove(actor: Actor, id: string): Promise<void> {
    if (((await this.discountCodes.countUses([id])).get(id) ?? 0) > 0) {
      const code: DiscountCodeErrorCode = 'discount_code_used';

      throw new ConflictException({ code, message: 'A Registration has used the code' });
    }

    const removed = await this.discountCodes.remove(id);

    await this.audit.record(actor, {
      action: 'discount_code.remove',
      target: { type: 'discount_code', id },
      change: { before: removed, after: null },
    });
  }

  /**
   * Check a code a guardian typed for a Camp now: the code, if the Camp has it, and whether it can be used.
   * @param campId Camp id
   * @param text the code as typed, in any case
   */
  public async check(
    campId: string,
    text: string,
  ): Promise<{ code: DiscountCodeEntity | null; status: DiscountCodeStatus }> {
    return this.statusOf(await this.discountCodes.getByCode(campId, text.trim()));
  }

  /**
   * Check a code as `check` does for a submission about to take a use of it, holding the code until the
   * unit of work ends, so simultaneous submissions take its last use one at a time.
   * @param campId Camp id
   * @param text the code as typed, in any case
   */
  public async checkForUse(
    campId: string,
    text: string,
  ): Promise<{ code: DiscountCodeEntity | null; status: DiscountCodeStatus }> {
    return this.statusOf(await this.discountCodes.lockByCode(campId, text.trim()));
  }

  /**
   * Record a Registration's use of a code it was priced with.
   * @param codeId Discount code id
   * @param registrationId Registration id
   * @param usedAt when the Registration was submitted
   */
  public async recordUse(codeId: string, registrationId: string, usedAt: Date): Promise<void> {
    await this.discountCodes.recordUse(codeId, registrationId, usedAt);
  }

  /**
   * Insert a code; one the Camp already has, perhaps taken by a simultaneous request, is refused with its code.
   * @param campId Camp id
   * @param body the code
   * @throws {ConflictException} discount_code_taken when the Camp has the code in any case
   */
  private async insert(campId: string, body: CreateDiscountCodeBody): Promise<DiscountCodeEntity> {
    try {
      return await this.discountCodes.create(campId, body);
    } catch (error) {
      if (violatedConstraint(error, 'unique') === 'discount_codes_camp_id_code_key') {
        const code: DiscountCodeErrorCode = 'discount_code_taken';

        throw new ConflictException({ code, message: 'The Camp has this code already' });
      }

      throw error;
    }
  }

  /**
   * Tell a code's status now from its recorded uses.
   * @param code the code, or null when the Camp has none such
   */
  private async statusOf(
    code: DiscountCodeEntity | null,
  ): Promise<{ code: DiscountCodeEntity | null; status: DiscountCodeStatus }> {
    const uses = code === null ? 0 : ((await this.discountCodes.countUses([code.id])).get(code.id) ?? 0);

    return { code, status: discountCodeStatus(code, uses, this.clock.now()) };
  }

  /**
   * Show a code with its uses and its status by the Clock.
   * @param code the code
   * @param uses its recorded uses
   */
  private withStatus(code: DiscountCodeEntity, uses: number): DiscountCodeResource {
    return code.toDto(uses, discountCodeStatus(code, uses, this.clock.now()));
  }
}
