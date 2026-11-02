import type { InferSelectModel } from 'drizzle-orm';

import type { totpCredentials } from '../../../db/schema.ts';

export type TotpCredentialSelectModel = InferSelectModel<typeof totpCredentials>;

export class TotpCredentialEntity {
  public readonly adminId: string;
  // Sealed with the master key; only the TOTP service opens it.
  public readonly sealedSecret: Buffer;
  public readonly confirmed: boolean;

  constructor(row: TotpCredentialSelectModel) {
    this.adminId = row.adminId;
    this.sealedSecret = row.secret;
    this.confirmed = row.confirmedAt !== null;
  }
}
