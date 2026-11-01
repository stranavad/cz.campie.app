import type { InferSelectModel } from 'drizzle-orm';

import type { organisationKeys } from '../../../db/schema.ts';

export type OrganisationKeySelectModel = InferSelectModel<typeof organisationKeys>;

export class OrganisationKeyEntity {
  public readonly organisationId: string;
  public readonly wrappedKey: Buffer;

  constructor(row: OrganisationKeySelectModel) {
    this.organisationId = row.organisationId;
    this.wrappedKey = row.wrappedKey;
  }
}
