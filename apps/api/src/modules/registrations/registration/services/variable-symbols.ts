import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { pragueDateOf } from '@repo/schema/shared';

// Draws Variable symbols: two digits of the Prague year, then six random ones.
@Injectable()
export class VariableSymbols {
  /**
   * Draw a Variable symbol for a Registration submitted at an instant; another may already have it.
   * @param submittedAt when the Registration is submitted
   */
  public draw(submittedAt: Date): string {
    return `${pragueDateOf(submittedAt).slice(2, 4)}${randomInt(1_000_000).toString().padStart(6, '0')}`;
  }
}
