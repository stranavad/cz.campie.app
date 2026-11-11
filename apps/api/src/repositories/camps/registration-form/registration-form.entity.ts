import { isDeepStrictEqual } from 'node:util';
import type { InferSelectModel } from 'drizzle-orm';

import type { Declaration, RegistrationForm, RegistrationFormVersion, ShownDeclaration } from '@repo/schema/camps';
import type { FormDefinition } from '@repo/schema/form-engine';

import type { registrationFormVersions } from '../../../db/schema.ts';

export type RegistrationFormVersionSelectModel = InferSelectModel<typeof registrationFormVersions>;

// A Camp's draft, the preset one when the Camp never saved its own.
export class RegistrationFormDraftEntity {
  public readonly campId: string;
  public readonly draft: FormDefinition;
  public readonly maxParticipants: number;
  public readonly declarations: readonly Declaration[];

  constructor(row: { campId: string; draft: FormDefinition; maxParticipants: number; declarations: Declaration[] }) {
    this.campId = row.campId;
    this.draft = row.draft;
    this.maxParticipants = row.maxParticipants;
    this.declarations = row.declarations;
  }

  toDto(declarations: ShownDeclaration[], latest: RegistrationFormVersionEntity | null): RegistrationForm {
    return {
      campId: this.campId,
      draft: this.draft,
      maxParticipants: this.maxParticipants,
      declarations,
      latest: latest === null ? null : latest.toSummaryDto(),
      // Compared by value, not text: jsonb keeps its own key order.
      draftChanged:
        latest === null ||
        !isDeepStrictEqual(
          { definition: this.draft, maxParticipants: this.maxParticipants, declarations: this.declarations },
          { definition: latest.definition, maxParticipants: latest.maxParticipants, declarations: latest.declarations },
        ),
    };
  }
}

export class RegistrationFormVersionEntity {
  public readonly id: string;
  public readonly campId: string;
  public readonly version: number;
  public readonly definition: FormDefinition;
  public readonly maxParticipants: number;
  public readonly declarations: readonly Declaration[];
  public readonly publishedAt: Date;

  constructor(row: RegistrationFormVersionSelectModel) {
    this.id = row.id;
    this.campId = row.campId;
    this.version = row.version;
    this.definition = row.definition;
    this.maxParticipants = row.maxParticipants;
    this.declarations = row.declarations;
    this.publishedAt = row.publishedAt;
  }

  toDto(declarations: ShownDeclaration[]): RegistrationFormVersion {
    return { ...this.toSummaryDto(), definition: this.definition, declarations };
  }

  toSummaryDto(): Pick<RegistrationFormVersion, 'version' | 'maxParticipants' | 'publishedAt'> {
    return {
      version: this.version,
      maxParticipants: this.maxParticipants,
      publishedAt: this.publishedAt.toISOString(),
    };
  }
}
