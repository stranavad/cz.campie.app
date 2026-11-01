import type { KeyObject } from 'node:crypto';

export abstract class KeyProvider {
  /**
   * Get the platform master key, which wraps every Organisation's data key.
   */
  public abstract masterKey(): KeyObject;
}
