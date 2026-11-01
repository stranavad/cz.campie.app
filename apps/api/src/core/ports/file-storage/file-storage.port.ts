import type { Readable } from 'node:stream';

// Objects are opaque bytes under a key: the app encrypts files before they get here, so content
// type and file name live with the file's record, not in storage.
export abstract class FileStorage {
  /**
   * Store an object, replacing any under the same key.
   * @param key object key
   * @param body the bytes, streamed
   * @param contentLength exact number of bytes in body
   */
  public abstract put(key: string, body: Readable, contentLength: number): Promise<void>;

  /**
   * Stream an object's bytes; rejects when no object has the key.
   * @param key object key
   */
  public abstract get(key: string): Promise<Readable>;

  /**
   * Delete an object. Deleting a missing key succeeds, so a retried delete is safe.
   * @param key object key
   */
  public abstract delete(key: string): Promise<void>;

  /**
   * Check whether an object exists under the key.
   * @param key object key
   */
  public abstract exists(key: string): Promise<boolean>;

  /**
   * Check that storage is reachable and the bucket accessible; for the health check only.
   * @param signal gives up when aborted, where the client supports it
   */
  public abstract ping(signal: AbortSignal): Promise<void>;
}
