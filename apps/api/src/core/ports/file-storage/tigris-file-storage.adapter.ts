import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { get, head, list, put, remove } from '@tigrisdata/storage';

import type { Env } from '../../config/env.schema.ts';
import { FileStorage } from './file-storage.port.ts';

type TigrisConfig = Extract<Env['fileStorage'], { adapter: 'tigris' }>;

// The library reports failures in its result instead of throwing, so every call is unwrapped.
function unwrap<T>(result: { data: T; error?: never } | { error: Error; data?: never }): T {
  if (result.error) {
    throw result.error;
  }

  return result.data;
}

export class TigrisFileStorage extends FileStorage {
  private readonly config: { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string };

  constructor({ endpoint, bucket, accessKeyId, secretAccessKey }: TigrisConfig) {
    super();
    this.config = { endpoint, bucket, accessKeyId, secretAccessKey };
  }

  // The library uploads a stream of any length in parts, so it needs no length up front.
  public async put(key: string, body: Readable, _contentLength: number): Promise<void> {
    // Private is also the library's default; stated so no change of default can publish a file.
    unwrap(await put(key, Readable.toWeb(body), { access: 'private', config: this.config }));
  }

  public async get(key: string): Promise<Readable> {
    const stream = unwrap(await get(key, 'stream', { config: this.config }));

    // The library's ReadableStream is the web standard one, which Node's own type also describes.
    return Readable.fromWeb(stream as ReadableStream);
  }

  public async delete(key: string): Promise<void> {
    unwrap(await remove(key, { config: this.config }));
  }

  public async exists(key: string): Promise<boolean> {
    return unwrap(await head(key, { config: this.config })) !== undefined;
  }

  // The library takes no abort signal; the health check's own timeout covers it.
  public async ping(_signal: AbortSignal): Promise<void> {
    unwrap(await list({ limit: 1, config: this.config }));
  }
}
