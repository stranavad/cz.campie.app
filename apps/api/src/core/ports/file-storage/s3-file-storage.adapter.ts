import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import type { Env } from '../../config/env.schema.ts';
import { FileStorage } from './file-storage.port.ts';

type S3Config = Extract<Env['fileStorage'], { adapter: 's3' }>;

// Any S3-compatible server; locally RustFS.
export class S3FileStorage extends FileStorage {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(config: S3Config) {
    super();
    this.bucket = config.bucket;
    this.s3 = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      // A server on a plain host has no per-bucket subdomains.
      forcePathStyle: true,
    });
  }

  public async put(key: string, body: Readable, contentLength: number): Promise<void> {
    // A stream body needs its length up front; the SDK cannot sign a stream of unknown length.
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentLength: contentLength }),
    );
  }

  public async get(key: string): Promise<Readable> {
    const { Body } = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));

    if (!(Body instanceof Readable)) {
      throw new Error(`Object ${key} has no readable body`);
    }

    return Body;
  }

  public async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  public async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));

      return true;
    } catch (error) {
      if (error instanceof NotFound) {
        return false;
      }

      throw error;
    }
  }

  public async ping(signal: AbortSignal): Promise<void> {
    await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }), { abortSignal: signal });
  }
}
