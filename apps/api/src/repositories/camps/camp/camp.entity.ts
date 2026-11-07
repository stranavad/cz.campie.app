import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { CampBranding } from '@repo/schema/camps';
import type { FileLink } from '@repo/schema/files';

import type { camps } from '../../../db/schema.ts';

export type CampSelectModel = InferSelectModel<typeof camps>;
export type CampInsertModel = InferInsertModel<typeof camps>;

export class CampEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly accentColour: string | null;
  public readonly logoFileId: string | null;

  constructor(row: CampSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.name = row.name;
    this.slug = row.slug;
    this.accentColour = row.accentColour;
    this.logoFileId = row.logoFileId;
  }

  toBrandingDto(logo: FileLink | null, effective: { accentColour: string; logo: FileLink | null }): CampBranding {
    return { accentColour: this.accentColour, logo, effective };
  }
}
