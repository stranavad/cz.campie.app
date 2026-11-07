import type { InferSelectModel } from 'drizzle-orm';

import type { RegistrationForm, RegistrationFormVersion } from '@repo/schema/camps';
import type { FormDefinition } from '@repo/schema/form-engine';

import type { registrationFormVersions } from '../../../db/schema.ts';

export type RegistrationFormVersionSelectModel = InferSelectModel<typeof registrationFormVersions>;

// A Camp's draft, the preset one when the Camp never saved its own.
export class RegistrationFormDraftEntity {
  public readonly campId: string;
  public readonly draft: FormDefinition;
  public readonly maxParticipants: number;

  constructor(row: { campId: string; draft: FormDefinition; maxParticipants: number }) {
    this.campId = row.campId;
    this.draft = row.draft;
    this.maxParticipants = row.maxParticipants;
  }

  toDto(latest: RegistrationFormVersionEntity | null): RegistrationForm {
    return {
      campId: this.campId,
      draft: this.draft,
      maxParticipants: this.maxParticipants,
      latest: latest === null ? null : latest.toSummaryDto(),
    };
  }
}

export class RegistrationFormVersionEntity {
  public readonly id: string;
  public readonly campId: string;
  public readonly version: number;
  public readonly definition: FormDefinition;
  public readonly maxParticipants: number;
  public readonly publishedAt: Date;

  constructor(row: RegistrationFormVersionSelectModel) {
    this.id = row.id;
    this.campId = row.campId;
    this.version = row.version;
    this.definition = row.definition;
    this.maxParticipants = row.maxParticipants;
    this.publishedAt = row.publishedAt;
  }

  toDto(): RegistrationFormVersion {
    return { ...this.toSummaryDto(), definition: this.definition };
  }

  toSummaryDto(): Omit<RegistrationFormVersion, 'definition'> {
    return {
      version: this.version,
      maxParticipants: this.maxParticipants,
      publishedAt: this.publishedAt.toISOString(),
    };
  }
}
