import type { InferSelectModel } from 'drizzle-orm';

import type { totpCredentials } from '../../../db/schema.ts';

export type TotpCredentialSelectModel = InferSelectModel<typeof totpCredentials>;

export class TotpCredentialEntity {
  public readonly adminId: string;
  // Sealed with the master key; only the TOTP service opens it.
  public readonly sealedSecret: Buffer;
  // Sealed like the secret; null unless a move to a new phone waits for its first code.
  public readonly sealedReplacementSecret: Buffer | null;
  public readonly confirmed: boolean;
  // When two-step login was turned on; null until then.
  public readonly confirmedAt: Date | null;

  constructor(row: TotpCredentialSelectModel) {
    this.adminId = row.adminId;
    this.sealedSecret = row.secret;
    this.sealedReplacementSecret = row.replacementSecret;
    this.confirmed = row.confirmedAt !== null;
    this.confirmedAt = row.confirmedAt;
  }
}
