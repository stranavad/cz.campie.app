import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { DiscountCodeCheck, PreviewPriceBody, PreviewPriceResponse } from '@repo/schema/camps';
import { surchargesOf } from '@repo/schema/form-engine';
import { priceRegistration } from '@repo/schema/pricing';

import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../../../../repositories/camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { DiscountCodeService } from '../../discount-code/services/discount-code.service.ts';

@Injectable()
export class PricePreviewService {
  private readonly limit: RequestLimit;

  constructor(
    private readonly camps: CampRepository,
    private readonly turnusy: TurnusRepository,
    private readonly forms: RegistrationFormRepository,
    private readonly discountCodes: DiscountCodeService,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).pricePreview;
  }

  /**
   * Price a form filled in so far, as the pricing module would at this moment: the Turnus's price list,
   * the Camp's Sibling discount, the surcharges of the answers under the latest published form, and the
   * code if it applies now. Counts against the price preview's limit of the address and the Organisation.
   * @param slug the Camp's slug or a former one
   * @param body the Turnus, the answers, the payment choice and the code
   * @param ipAddress where the request comes from
   * @throws {NotFoundException} when the Camp is unknown, has no published form, or the Turnus is not its
   */
  public async preview(slug: string, body: PreviewPriceBody, ipAddress: string): Promise<PreviewPriceResponse> {
    await this.rateLimiter.admit(this.limit, { ipAddress, target: this.unitOfWork.organisationId });
    const camp = await this.camps.getBySlug(slug.toLowerCase());
    const form = camp === null ? null : await this.forms.getLatestVersion(camp.id);
    const turnus = await this.turnusy.getById(body.turnusId);

    if (camp === null || form === null || turnus === null || turnus.campId !== camp.id) {
      throw new NotFoundException();
    }

    const check =
      body.discountCode === null || body.discountCode === ''
        ? null
        : await this.discountCodes.check(camp.id, body.discountCode);
    const price = priceRegistration({
      priceList: turnus,
      siblingDiscount: camp.toSiblingDiscount(),
      participants: surchargesOf(form.definition, body.submission),
      discountCode: check?.status === 'valid' && check.code !== null ? check.code.toPricing() : null,
      paymentChoice: body.paymentChoice,
      submittedAt: this.clock.now(),
    });

    return { ...price, lines: [...price.lines], discountCode: check === null ? null : checkOf(check.status) };
  }
}

/**
 * Name a code's status as the form reports it.
 * @param status the code's status now
 */
function checkOf(status: 'valid' | Exclude<DiscountCodeCheck, 'applied'>): DiscountCodeCheck {
  return status === 'valid' ? 'applied' : status;
}
