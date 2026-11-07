import { extname } from 'node:path';
import { pipeline, Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  FILE_CONTENT_TYPES,
  MAX_FILE_BYTES,
  UPLOAD_CONTENT_TYPES,
  XLSX_CONTENT_TYPE,
  type FileContentType,
  type FileLink,
} from '@repo/schema/files';
import { LOGO_CONTENT_TYPES, MAX_LOGO_BYTES } from '@repo/schema/organisations';

import { FileRepository } from '../../repositories/files/file/file.repository.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import type { OrganisationCipher } from '../encryption/cipher.ts';
import { EncryptionService } from '../encryption/encryption.service.ts';
import { JobQueue } from '../jobs/job-queue.ts';
import { Clock } from '../ports/clock/clock.port.ts';
import { FileStorage } from '../ports/file-storage/file-storage.port.ts';
import { KeyProvider } from '../ports/key-provider/key-provider.port.ts';
import { deleteStoredFileJob } from './delete-stored-file.job.ts';
import { downloadLinkKey, readDownloadToken, signDownloadToken } from './download-token.ts';
import { uploadRejected, type FileUpload } from './file-upload.ts';
import { objectKey } from './object-key.ts';

// How each allowed type begins, and the names it may carry. The content decides; the name only has to agree.
const FILE_TYPES: Record<FileContentType, { readonly signature: Buffer; readonly extensions: readonly string[] }> = {
  'application/pdf': { signature: Buffer.from('%PDF-'), extensions: ['.pdf'] },
  'image/jpeg': { signature: Buffer.from('ffd8ff', 'hex'), extensions: ['.jpg', '.jpeg'] },
  'image/png': { signature: Buffer.from('89504e470d0a1a0a', 'hex'), extensions: ['.png'] },
  [XLSX_CONTENT_TYPE]: { signature: Buffer.from('504b0304', 'hex'), extensions: ['.xlsx'] },
};

// What a feature narrows an upload to, such as a logo to small images.
export interface StoreLimits {
  readonly allow?: readonly FileContentType[];
  readonly maxBytes?: number;
}

// An Organisation's or a Camp's logo: shown on every public page and in every document, so a small image.
export const LOGO_LIMITS: StoreLimits = { allow: LOGO_CONTENT_TYPES, maxBytes: MAX_LOGO_BYTES };

// Long enough to open a file on a slow phone, short enough that a forwarded or logged link soon dies.
const LINK_LIFETIME_MS = 5 * 60 * 1000;

// A file on its way out: its plaintext, streamed, and what the response needs to present it.
export interface FileDownload {
  readonly id: string;
  readonly contentType: FileContentType;
  readonly name: string;
  readonly size: number;
  // Errors on a wrong key or altered ciphertext, possibly after some verified bytes.
  readonly content: Readable;
}

// The one way files enter and leave the platform: storage holds only ciphertext under the Organisation's
// key, and a file is read back only through a short-lived download link.
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly files: FileRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly encryption: EncryptionService,
    private readonly storage: FileStorage,
    private readonly keyProvider: KeyProvider,
    private readonly clock: Clock,
    private readonly jobs: JobQueue,
  ) {}

  /**
   * Store an uploaded file encrypted with the current Organisation's key.
   * @param upload the file as uploaded
   * @param limits the types a feature takes and its size limit, narrower than every upload's
   * @throws {BadRequestException} when the content is not an allowed type, or the name says otherwise
   * @throws {PayloadTooLargeException} when the file is over the size limit
   */
  public async store(upload: FileUpload, limits: StoreLimits = {}): Promise<string> {
    const { allow = UPLOAD_CONTENT_TYPES, maxBytes = MAX_FILE_BYTES } = limits;
    const contentType = contentTypeOf(upload);

    if (contentType === null || !allow.includes(contentType)) {
      throw uploadRejected('file_type_not_allowed');
    }

    if (upload.bytes.length > maxBytes) {
      throw uploadRejected('file_too_large');
    }

    const cipher = await this.encryption.cipher();

    const file = await this.files.create({
      contentType,
      name: cipher.encrypt(upload.name),
      size: upload.bytes.length,
    });
    const key = objectKey(this.unitOfWork.organisationId, file.id);

    // The object is written before the record commits; if the record rolls back, nothing would point to it.
    this.unitOfWork.afterRollback(() => this.deleteOrphan(key, file.id));
    const ciphertext = await buffer(Readable.from([upload.bytes]).pipe(cipher.encryptStream()));
    await this.storage.put(key, Readable.from([ciphertext]), ciphertext.length);

    return file.id;
  }

  /**
   * Create a short-lived link that opens a file of the current Organisation without a session. Call it only
   * after checking the caller may see the file.
   * @param fileId the file's id
   */
  public async link(fileId: string): Promise<FileLink> {
    const file = await this.files.getByIdOrThrow(fileId);
    const expiresAt = new Date(this.clock.now().getTime() + LINK_LIFETIME_MS);

    const token = signDownloadToken(this.linkKey(), {
      organisationId: this.unitOfWork.organisationId,
      fileId: file.id,
      expiresAt,
    });

    return { url: `/api/downloads/${token}`, expiresAt: expiresAt.toISOString() };
  }

  /**
   * Create short-lived links to several files of the current Organisation at once, in one query. Call it
   * only after checking the caller may see the files.
   * @param fileIds the files' ids
   * @returns a link by file id; a file that does not exist has none
   */
  public async links(fileIds: readonly string[]): Promise<Map<string, FileLink>> {
    const existing = await this.files.listByIds(fileIds);
    const expiresAt = new Date(this.clock.now().getTime() + LINK_LIFETIME_MS);

    return new Map(
      existing.map(({ id: fileId }) => {
        const token = signDownloadToken(this.linkKey(), {
          organisationId: this.unitOfWork.organisationId,
          fileId,
          expiresAt,
        });

        return [fileId, { url: `/api/downloads/${token}`, expiresAt: expiresAt.toISOString() }];
      }),
    );
  }

  /**
   * Read the names files were uploaded with, decrypted, in one query.
   * @param fileIds the files' ids
   * @returns a name by file id; a file that does not exist has none
   */
  public async names(fileIds: readonly string[]): Promise<Map<string, string>> {
    const existing = await this.files.listByIds(fileIds);

    if (existing.length === 0) {
      return new Map();
    }

    const cipher = await this.encryption.cipher();

    return new Map(existing.map((file) => [file.id, cipher.decrypt(file.name)]));
  }

  /**
   * Open the file a download link grants, in its Organisation's unit of work.
   * @param token the token from the link
   * @throws {NotFoundException} when the token is not one this platform signed, or it expired
   */
  public async open(token: string): Promise<FileDownload> {
    const grant = readDownloadToken(this.linkKey(), token);

    if (grant === null || grant.expiresAt <= this.clock.now()) {
      throw new NotFoundException();
    }

    const { file, cipher } = await this.unitOfWork.run(grant.organisationId, async () => ({
      file: await this.files.getByIdOrThrow(grant.fileId),
      cipher: await this.encryption.cipher(),
    }));

    return {
      id: file.id,
      contentType: file.contentType,
      name: cipher.decrypt(file.name),
      size: file.size,
      content: await this.decrypted(grant.organisationId, file.id, cipher),
    };
  }

  /**
   * Read a whole file of the current Organisation, decrypted, for the server's own use (a logo in a
   * generated document, an email's attachment). Call it only for files the reader may see.
   * @param fileId the file's id
   */
  public async read(fileId: string): Promise<{ name: string; contentType: FileContentType; bytes: Buffer }> {
    const file = await this.files.getByIdOrThrow(fileId);
    const cipher = await this.encryption.cipher();

    const content = await this.decrypted(this.unitOfWork.organisationId, file.id, cipher);

    return { name: cipher.decrypt(file.name), contentType: file.contentType, bytes: await buffer(content) };
  }

  /**
   * Remove a file record of the current Organisation; its stored object follows once the removal commits.
   * @param fileId the file's id
   */
  public async remove(fileId: string): Promise<void> {
    await this.files.remove(fileId);

    this.jobs.enqueue(deleteStoredFileJob, { fileId });
  }

  /**
   * Stream a stored file's plaintext.
   * @param organisationId the file's Organisation
   * @param fileId the file's id
   * @param cipher the Organisation's cipher
   */
  private async decrypted(organisationId: string, fileId: string, cipher: OrganisationCipher): Promise<Readable> {
    const ciphertext = await this.storage.get(objectKey(organisationId, fileId));

    // The decrypting stream carries the errors of both, so the reader sees any failure.
    return pipeline(ciphertext, cipher.decryptStream(), () => undefined);
  }

  /**
   * Delete the stored object of a file whose record rolled back. Best effort: a failure is logged, so the
   * rollback's own error still reaches the caller.
   * @param key the object's key
   * @param fileId the rolled-back file's id, for the log
   */
  private async deleteOrphan(key: string, fileId: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.error(
        `Stored object of rolled-back file ${fileId} was not deleted: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Derive the key that signs download links.
   */
  private linkKey() {
    return downloadLinkKey(this.keyProvider.masterKey());
  }
}

/**
 * Tell an upload's type from its first bytes, and check that its name's extension agrees.
 * @param upload the file as uploaded
 * @returns null when the content is no allowed type or the name claims another
 */
function contentTypeOf({ name, bytes }: FileUpload): FileContentType | null {
  const extension = extname(name).toLowerCase();

  for (const contentType of FILE_CONTENT_TYPES) {
    const { signature, extensions } = FILE_TYPES[contentType];

    if (bytes.subarray(0, signature.length).equals(signature)) {
      return extensions.includes(extension) ? contentType : null;
    }
  }

  return null;
}
