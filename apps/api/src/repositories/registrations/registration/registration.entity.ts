import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { Answers } from '@repo/schema/form-engine';
import type { PaymentChoice } from '@repo/schema/pricing';

import type { registrations } from '../../../db/schema.ts';

export type RegistrationSelectModel = InferSelectModel<typeof registrations>;
export type RegistrationInsertModel = InferInsertModel<typeof registrations>;

export class RegistrationEntity {
  public readonly id: string;
  public readonly turnusId: string;
  public readonly formVersionId: string;
  public readonly variableSymbol: string;
  public readonly paymentChoice: PaymentChoice;
  public readonly depositTotal: number | null;
  public readonly answers: Answers;
  public readonly submittedAt: Date;
  public readonly erasedAt: Date | null;

  constructor(row: RegistrationSelectModel) {
    this.id = row.id;
    this.turnusId = row.turnusId;
    this.formVersionId = row.formVersionId;
    this.variableSymbol = row.variableSymbol;
    this.paymentChoice = row.paymentChoice;
    this.depositTotal = row.depositTotal;
    this.answers = row.answers;
    this.submittedAt = row.submittedAt;
    this.erasedAt = row.erasedAt;
  }
}
