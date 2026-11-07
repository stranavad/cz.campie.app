import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import {
  CAMP_MODULES,
  type Camp,
  type CampBranding,
  type CampModule,
  type CampModules,
  type CampSummary,
  type PublicCamp,
} from '@repo/schema/camps';
import type { FileLink } from '@repo/schema/files';

import type { camps } from '../../../db/schema.ts';

export type CampSelectModel = InferSelectModel<typeof camps>;
export type CampInsertModel = InferInsertModel<typeof camps>;

export class CampEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly websiteUrl: string | null;
  public readonly contactName: string | null;
  public readonly contactEmail: string | null;
  public readonly contactPhone: string | null;
  public readonly modules: readonly CampModule[];
  public readonly accentColour: string | null;
  public readonly logoFileId: string | null;

  constructor(row: CampSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.name = row.name;
    this.slug = row.slug;
    this.websiteUrl = row.websiteUrl;
    this.contactName = row.contactName;
    this.contactEmail = row.contactEmail;
    this.contactPhone = row.contactPhone;
    // Stored sorted, so an audit entry shows a change of switches, not of their order.
    this.modules = CAMP_MODULES.filter((module) => row.modules.includes(module));
    this.accentColour = row.accentColour;
    this.logoFileId = row.logoFileId;
  }

  toDto(): Camp {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      websiteUrl: this.websiteUrl,
      contactName: this.contactName,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      modules: modulesRecord(this.modules),
    };
  }

  toSummaryDto(): CampSummary {
    return { id: this.id, name: this.name, slug: this.slug };
  }

  toPublicDto(branding: { accentColour: string; logoUrl: string | null }): PublicCamp {
    return { id: this.id, name: this.name, slug: this.slug, websiteUrl: this.websiteUrl, ...branding };
  }

  toBrandingDto(logo: FileLink | null, effective: { accentColour: string; logo: FileLink | null }): CampBranding {
    return { accentColour: this.accentColour, logo, effective };
  }
}

/**
 * Write the switched-on modules as a switch per module.
 * @param modules the modules switched on
 */
function modulesRecord(modules: readonly CampModule[]): CampModules {
  return Object.fromEntries(CAMP_MODULES.map((module) => [module, modules.includes(module)])) as CampModules;
}
