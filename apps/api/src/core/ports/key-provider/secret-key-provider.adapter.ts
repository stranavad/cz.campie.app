import { createSecretKey, type KeyObject } from 'node:crypto';

import { KeyProvider } from './key-provider.port.ts';

// The master key comes from a deployment secret; a KeyObject keeps the raw bytes out of logs and JSON.
export class SecretKeyProvider extends KeyProvider {
  private readonly key: KeyObject;

  constructor(masterKeyBase64: string) {
    super();
    this.key = createSecretKey(Buffer.from(masterKeyBase64, 'base64'));
  }

  public masterKey(): KeyObject {
    return this.key;
  }
}
