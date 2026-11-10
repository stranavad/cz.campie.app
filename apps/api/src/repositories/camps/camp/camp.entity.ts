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
import type { SiblingDiscount, SiblingDiscountMode } from '@repo/schema/pricing';

import type { camps } from '../../../db/schema.ts';

export type CampSelectModel = InferSelectModel<typeof camps>;
export type CampInsertModel = InferInsertModel<typeof camps>;

export class CampEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly websiteUrl: string | null;
  public readonly description: string | null;
  public readonly contactName: string | null;
  public readonly contactEmail: string | null;
  public readonly contactPhone: string | null;
  public readonly modules: readonly CampModule[];
  public readonly siblingDiscountAmount: number;
  public readonly siblingDiscountAppliesTo: SiblingDiscountMode;
  public readonly notificationEmails: readonly string[];
  public readonly contactEditLockDate: string | null;
  public readonly accentColour: string | null;
  public readonly logoFileId: string | null;
  public readonly photoFileId: string | null;

  constructor(row: CampSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.name = row.name;
    this.slug = row.slug;
    this.websiteUrl = row.websiteUrl;
    this.description = row.description;
    this.contactName = row.contactName;
    this.contactEmail = row.contactEmail;
    this.contactPhone = row.contactPhone;
    // Stored sorted, so an audit entry shows a change of switches, not of their order.
    this.modules = CAMP_MODULES.filter((module) => row.modules.includes(module));
    this.siblingDiscountAmount = row.siblingDiscountAmount;
    this.siblingDiscountAppliesTo = row.siblingDiscountAppliesTo;
    this.notificationEmails = row.notificationEmails;
    this.contactEditLockDate = row.contactEditLockDate;
    this.accentColour = row.accentColour;
    this.logoFileId = row.logoFileId;
    this.photoFileId = row.photoFileId;
  }

  toDto(): Camp {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      websiteUrl: this.websiteUrl,
      description: this.description,
      contactName: this.contactName,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      modules: modulesRecord(this.modules),
      siblingDiscountAmount: this.siblingDiscountAmount,
      siblingDiscountAppliesTo: this.siblingDiscountAppliesTo,
      notificationEmails: [...this.notificationEmails],
      contactEditLockDate: this.contactEditLockDate,
    };
  }

  // The Sibling discount as pricing takes it; an amount of 0 is none.
  toSiblingDiscount(): SiblingDiscount | null {
    return this.siblingDiscountAmount === 0
      ? null
      : { amount: this.siblingDiscountAmount, appliesTo: this.siblingDiscountAppliesTo };
  }

  toSummaryDto(): CampSummary {
    return { id: this.id, name: this.name, slug: this.slug };
  }

  toPublicDto(
    appearance: { accentColour: string; logoUrl: string | null; photoUrl: string | null },
    contact: { contactEmail: string; contactPhone: string | null },
    cardPayments: boolean,
  ): PublicCamp {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      websiteUrl: this.websiteUrl,
      description: this.description,
      contactName: this.contactName,
      ...contact,
      ...appearance,
      cardPayments,
      invoiceRequests: this.modules.includes('invoiceRequests'),
      siblingDiscount: this.toSiblingDiscount(),
    };
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

/**
 * Build the address a Camp's photo is served at on its Organisation's subdomain. The file id is part of it,
 * so a new photo gets a new address and browsers may keep a photo for good.
 * @param fileId the photo's file id
 */
export function publicCampPhotoUrl(fileId: string): string {
  return `/api/camp-photos/${fileId}`;
}
