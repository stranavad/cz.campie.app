import { Injectable } from '@nestjs/common';

import { OrganisationKeyRepository } from '../../repositories/organisations/organisation-key/organisation-key.repository.ts';
import { KeyProvider } from '../ports/key-provider/key-provider.port.ts';
import {
  generateWrappedDataKey,
  openPlatformSecret,
  OrganisationCipher,
  sealPlatformSecret,
  unwrapDataKey,
} from './cipher.ts';

// The only holder of unwrapped data keys. They exist in memory only; the database holds them wrapped by
// the master key.
@Injectable()
export class EncryptionService {
  constructor(
    private readonly keyProvider: KeyProvider,
    private readonly organisationKeys: OrganisationKeyRepository,
  ) {}

  /**
   * Generate a new Organisation's data key and store it wrapped by the master key.
   * @param organisationId the new Organisation
   */
  public async createDataKey(organisationId: string): Promise<void> {
    await this.organisationKeys.create(
      organisationId,
      generateWrappedDataKey(this.keyProvider.masterKey(), organisationId),
    );
  }

  /**
   * Get a cipher with the current Organisation's data key. It holds the key in memory, so it keeps
   * working after the unit of work ends, for streaming a file.
   * @throws {Error} when the Organisation's data key is destroyed
   */
  public async cipher(): Promise<OrganisationCipher> {
    const key = await this.organisationKeys.getCurrent();

    if (key === null) {
      throw new Error("The Organisation's data key is destroyed; its encrypted data cannot be decrypted");
    }

    return new OrganisationCipher(unwrapDataKey(this.keyProvider.masterKey(), key.wrappedKey, key.organisationId));
  }

  /**
   * Seal a secret of the platform's own, such as an admin's TOTP secret, with the master key.
   * @param context what the secret belongs to, such as `totp:<admin id>`
   * @param secret the secret
   */
  public sealPlatformSecret(context: string, secret: Buffer): Buffer {
    return sealPlatformSecret(this.keyProvider.masterKey(), secret, context);
  }

  /**
   * Open a secret sealed by sealPlatformSecret for the same context.
   * @param context what the secret belongs to
   * @param sealed the secret as stored
   */
  public openPlatformSecret(context: string, sealed: Buffer): Buffer {
    return openPlatformSecret(this.keyProvider.masterKey(), sealed, context);
  }
}
