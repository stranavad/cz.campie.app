import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { Answers } from '@repo/schema/form-engine';
import type { PaymentChoice } from '@repo/schema/pricing';
import type { RegistrationSource } from '@repo/schema/registrations';

import type { Encrypted } from '../../../core/encryption/cipher.ts';
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
  public readonly encryptedAnswers: Encrypted | null;
  public readonly submittedAt: Date;
  public readonly source: RegistrationSource;
  public readonly depositDueDate: string;
  public readonly balanceDueDate: string | null;
  public readonly erasedAt: Date | null;

  constructor(row: RegistrationSelectModel) {
    this.id = row.id;
    this.turnusId = row.turnusId;
    this.formVersionId = row.formVersionId;
    this.variableSymbol = row.variableSymbol;
    this.paymentChoice = row.paymentChoice;
    this.depositTotal = row.depositTotal;
    this.answers = row.answers;
    this.encryptedAnswers = row.encryptedAnswers;
    this.submittedAt = row.submittedAt;
    this.source = row.source;
    this.depositDueDate = row.depositDueDate;
    this.balanceDueDate = row.balanceDueDate;
    this.erasedAt = row.erasedAt;
  }
}
