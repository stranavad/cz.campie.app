import type { InferSelectModel } from 'drizzle-orm';

import type { organisations } from '../../../db/schema.ts';

export type OrganisationSelectModel = InferSelectModel<typeof organisations>;

export class OrganisationEntity {
  public readonly id: string;
  public readonly subdomain: string;

  constructor(row: OrganisationSelectModel) {
    this.id = row.id;
    this.subdomain = row.subdomain;
  }
}
