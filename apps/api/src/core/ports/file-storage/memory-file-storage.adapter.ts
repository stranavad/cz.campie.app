import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';

import { FileStorage } from './file-storage.port.ts';

// Test only: objects live in this process, so a test can read what the app stored. Production refuses it.
export class MemoryFileStorage extends FileStorage {
  public readonly objects = new Map<string, Buffer>();

  public async put(key: string, body: Readable, contentLength: number): Promise<void> {
    const bytes = await buffer(body);

    // S3 rejects a body of another length than declared; failing here keeps the callers honest.
    if (bytes.length !== contentLength) {
      throw new Error(`Object ${key} has ${bytes.length} bytes, but ${contentLength} were declared`);
    }

    this.objects.set(key, bytes);
  }

  public get(key: string): Promise<Readable> {
    const bytes = this.objects.get(key);

    if (bytes === undefined) {
      return Promise.reject(new Error(`No object ${key}`));
    }

    return Promise.resolve(Readable.from([bytes]));
  }

  public delete(key: string): Promise<void> {
    this.objects.delete(key);

    return Promise.resolve();
  }

  public exists(key: string): Promise<boolean> {
    return Promise.resolve(this.objects.has(key));
  }

  public ping(_signal: AbortSignal): Promise<void> {
    return Promise.resolve();
  }
}
