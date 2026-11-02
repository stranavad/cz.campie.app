import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { camps } from '../../../db/schema.ts';

export type CampSelectModel = InferSelectModel<typeof camps>;
export type CampInsertModel = InferInsertModel<typeof camps>;

export class CampEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly name: string;
  public readonly slug: string;

  constructor(row: CampSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.name = row.name;
    this.slug = row.slug;
  }
}
