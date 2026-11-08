import type { InferSelectModel } from 'drizzle-orm';

import type { Answers } from '@repo/schema/form-engine';
import type { ParticipantStatus } from '@repo/schema/registrations';

import type { Encrypted } from '../../../core/encryption/cipher.ts';
import type { participants } from '../../../db/schema.ts';

export type ParticipantSelectModel = InferSelectModel<typeof participants>;

export class ParticipantEntity {
  public readonly id: string;
  public readonly registrationId: string;
  public readonly position: number;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly birthDate: string | null;
  public readonly status: ParticipantStatus;
  public readonly answers: Answers;
  public readonly encryptedAnswers: Encrypted | null;
  public readonly prihlaskaFileId: string | null;

  constructor(row: ParticipantSelectModel) {
    this.id = row.id;
    this.registrationId = row.registrationId;
    this.position = row.position;
    this.firstName = row.firstName;
    this.lastName = row.lastName;
    this.birthDate = row.birthDate;
    this.status = row.status;
    this.answers = row.answers;
    this.encryptedAnswers = row.encryptedAnswers;
    this.prihlaskaFileId = row.prihlaskaFileId;
  }
}
