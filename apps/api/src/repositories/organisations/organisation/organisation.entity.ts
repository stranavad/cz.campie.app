import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { ConsoleOrganisation } from '@repo/schema/console';
import type { FileLink } from '@repo/schema/files';
import type { OrganisationSettings, OrganisationStatus, PublicOrganisation } from '@repo/schema/organisations';

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
  public readonly statutoryRepresentative: string;
  public readonly vatId: string | null;
  public readonly contactEmail: string;
  public readonly contactPhone: string;
  public readonly billingEmail: string;
  public readonly bankAccount: string | null;
  public readonly displayName: string;
  public readonly accentColour: string;
  public readonly logoFileId: string | null;
  public readonly totpRequired: boolean;

  constructor(row: OrganisationSelectModel) {
    this.id = row.id;
    this.subdomain = row.subdomain;
    this.status = row.status;
    this.legalName = row.legalName;
    this.ico = row.ico;
    this.address = row.address;
    this.statutoryRepresentative = row.statutoryRepresentative;
    this.vatId = row.vatId;
    this.contactEmail = row.contactEmail;
    this.contactPhone = row.contactPhone;
    this.billingEmail = row.billingEmail;
    this.bankAccount = row.bankAccount;
    this.displayName = row.displayName;
    this.accentColour = row.accentColour;
    this.logoFileId = row.logoFileId;
    this.totpRequired = row.totpRequired;
  }

  toConsoleDto(mail: ConsoleOrganisation['mail']): ConsoleOrganisation {
    return {
      id: this.id,
      subdomain: this.subdomain,
      status: this.status,
      displayName: this.displayName,
      legalName: this.legalName,
      ico: this.ico,
      vatId: this.vatId,
      address: this.address,
      statutoryRepresentative: this.statutoryRepresentative,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      mail: { sent: mail.sent, bounced: mail.bounced, complained: mail.complained },
    };
  }

  toPublicDto(): PublicOrganisation {
    return {
      displayName: this.displayName,
      accentColour: this.accentColour,
      logoUrl: this.logoFileId === null ? null : publicLogoUrl(this.logoFileId),
    };
  }

  toSettingsDto(logo: FileLink | null): OrganisationSettings {
    return {
      legalName: this.legalName,
      ico: this.ico,
      vatId: this.vatId,
      address: this.address,
      statutoryRepresentative: this.statutoryRepresentative,
      bankAccount: this.bankAccount,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      billingEmail: this.billingEmail,
      displayName: this.displayName,
      accentColour: this.accentColour,
      logo,
      totpRequired: this.totpRequired,
    };
  }
}

/**
 * Build the address a logo is served at on its Organisation's subdomain. The file id is part of it, so a
 * new logo gets a new address and browsers may keep a logo for good.
 * @param fileId the logo's file id
 */
export function publicLogoUrl(fileId: string): string {
  return `/api/logos/${fileId}`;
}
