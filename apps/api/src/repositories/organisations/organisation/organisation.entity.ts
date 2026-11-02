import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { OrganisationStatus } from '@repo/schema/organisations';

import type { organisations } from '../../../db/schema.ts';

export type OrganisationSelectModel = InferSelectModel<typeof organisations>;
export type OrganisationInsertModel = InferInsertModel<typeof organisations>;

export class OrganisationEntity {
  public readonly id: string;
  public readonly subdomain: string;
  public readonly status: OrganisationStatus;
  public readonly legalName: string;
  public readonly ico: string;
  public readonly address: string;
  public readonly displayName: string;
  public readonly accentColour: string;
  public readonly logoFileId: string | null;

  constructor(row: OrganisationSelectModel) {
    this.id = row.id;
    this.subdomain = row.subdomain;
    this.status = row.status;
    this.legalName = row.legalName;
    this.ico = row.ico;
    this.address = row.address;
    this.displayName = row.displayName;
    this.accentColour = row.accentColour;
    this.logoFileId = row.logoFileId;
  }
}
