import type { InferSelectModel } from 'drizzle-orm';

import type { FileContentType } from '@repo/schema/files';

import type { Encrypted } from '../../../core/encryption/cipher.ts';
import type { files } from '../../../db/schema.ts';

export type FileSelectModel = InferSelectModel<typeof files>;

export class FileEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly contentType: FileContentType;
  public readonly name: Encrypted;
  public readonly size: number;

  constructor(row: FileSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.contentType = row.contentType;
    this.name = row.name;
    this.size = row.size;
  }
}
