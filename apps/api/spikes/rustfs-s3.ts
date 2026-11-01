// Does the Compose RustFS behave as S3 for the AWS SDK, for what the file storage port needs?
// Run from apps/api with the stack up: node spikes/rustfs-s3.ts
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const BUCKET = 'campie';
const SIZE = 10 * 1024 * 1024;

// The SDK defaults are kept on purpose (flexible checksums on upload, response checksum validation),
// so the spike covers the same code path a production adapter would use.
const s3 = new S3Client({
  endpoint: 'http://localhost:19000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'campie-local', secretAccessKey: 'campie-local-secret' },
  forcePathStyle: true,
});

const sha256 = (data: Buffer): string => createHash('sha256').update(data).digest('hex');

/**
 * Read an object back as a stream, hashing it chunk by chunk without buffering the whole body.
 */
async function streamedSha256(key: string): Promise<{ hash: string; bytes: number; chunks: number }> {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key, ChecksumMode: 'ENABLED' }));
  assert.ok(Body instanceof Readable, 'GetObject body is a Node Readable');

  const hash = createHash('sha256');
  let bytes = 0;
  let chunks = 0;
  for await (const chunk of Body) {
    assert.ok(chunk instanceof Buffer);
    hash.update(chunk);
    bytes += chunk.length;
    chunks += 1;
  }

  return { hash: hash.digest('hex'), bytes, chunks };
}

/**
 * Run the put, streamed get, head and delete cycle for one object.
 */
async function roundTrip(label: string, upload: (key: string, data: Buffer) => Promise<void>): Promise<void> {
  const key = `spike/${randomUUID()}`;
  const data = randomBytes(SIZE);

  await upload(key, data);

  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  assert.equal(head.ContentLength, SIZE);
  assert.equal(head.ContentType, 'application/octet-stream');
  assert.equal(head.Metadata?.['spike-label'], label);

  const read = await streamedSha256(key);
  assert.equal(read.bytes, SIZE);
  assert.equal(read.hash, sha256(data));

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  await assert.rejects(s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })), NotFound);
  await assert.rejects(s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key })), NoSuchKey);
  // Deleting a missing key succeeds in S3, so a retried delete is safe.
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

  console.log(`ok  ${label}: put, head, streamed get (${read.chunks} chunks), delete, head and get after delete`);
}

await roundTrip('buffer', async (key, data) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: 'application/octet-stream',
      Metadata: { 'spike-label': 'buffer' },
    }),
  );
});

// A stream body with a known length makes the SDK send an aws-chunked body with a trailing checksum,
// the part S3-compatible servers most often get wrong.
await roundTrip('stream', async (key, data) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Readable.from([data.subarray(0, SIZE / 2), data.subarray(SIZE / 2)]),
      ContentLength: SIZE,
      ContentType: 'application/octet-stream',
      Metadata: { 'spike-label': 'stream' },
    }),
  );
});

s3.destroy();
console.log('RustFS passed every check');
