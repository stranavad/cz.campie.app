import { createSecretKey, type KeyObject } from 'node:crypto';

import { KeyProvider } from './key-provider.port.ts';

// Public and constant, so local and test data stays readable across restarts. Production refuses it.
const FIXED_TEST_KEY = createSecretKey(Buffer.alloc(32, 'campie-fixed-test-key'));

export class FixedKeyProvider extends KeyProvider {
  public masterKey(): KeyObject {
    return FIXED_TEST_KEY;
  }
}
