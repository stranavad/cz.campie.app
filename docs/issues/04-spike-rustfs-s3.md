# 04 - Spike: RustFS as S3 for the AWS SDK

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 03
Stories: 191

## What to build

Prove that RustFS behaves as a drop-in S3 server for the AWS SDK, so the local and test file storage adapter can use the same SDK code path as any S3 provider. Exercise exactly what the file storage port needs: put, get (streamed), delete and existence check, including objects of several megabytes. Write the result into the issue's Comments section and, if RustFS falls short, name the alternative (for example MinIO) that will be used instead.

## Acceptance criteria

- [x] A script or test against the Compose RustFS performs put, streamed get, delete and head on a 10 MB object and passes
- [x] The finding (works / works with caveats / does not work, with the replacement) is recorded under `## Comments` in this file

## Notes

- Spec sections: Ports and adapters, Further Notes - To verify at project setup
- Presigning is not needed (spec Files), so it is not tested

## Comments

2026-11-01 - **Works.** RustFS 1.0.1 is a drop-in S3 server for `@aws-sdk/client-s3` 3.1152.0; the local and test file storage adapter uses the AWS SDK against it, no MinIO needed.

`apps/api/spikes/rustfs-s3.ts` (run from `apps/api` with the stack up: `node spikes/rustfs-s3.ts`) passes against the Compose RustFS on a 10 MB random object, twice: once uploaded as a Buffer, once as a stream with a known length. The SDK runs with its defaults (flexible checksums on upload, response checksum validation), the code path a production adapter uses.

- Put: Buffer body and stream body. The stream upload is sent `aws-chunked` with a trailing CRC32 checksum, the part S3-compatible servers most often reject; RustFS accepts it. Content type and user metadata come back on head.
- Get: `Body` is a Node `Readable`, consumed chunk by chunk (234-298 chunks) without buffering; the SHA-256 matches the upload. `ChecksumMode: 'ENABLED'` validates without error.
- Head: `ContentLength` is exact; after delete it throws the SDK's `NotFound`.
- Delete: works; deleting a missing key succeeds, as in S3, so a retried delete is safe. Get after delete throws `NoSuchKey`.
- Path-style addressing (`forcePathStyle: true`) is required, as for any S3 server on a plain host.

Caveats for issue 06: a stream body needs `ContentLength` (an SDK rule, not RustFS); objects of unknown length would need multipart upload (`@aws-sdk/lib-storage`), not tested since the encrypted file service (issue 12) knows the length. Presigning not tested, as noted above.
