# 04 - Spike: RustFS as S3 for the AWS SDK

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 03
Stories: 191

## What to build

Prove that RustFS behaves as a drop-in S3 server for the AWS SDK, so the local and test file storage adapter can use the same SDK code path as any S3 provider. Exercise exactly what the file storage port needs: put, get (streamed), delete and existence check, including objects of several megabytes. Write the result into the issue's Comments section and, if RustFS falls short, name the alternative (for example MinIO) that will be used instead.

## Acceptance criteria

- [ ] A script or test against the Compose RustFS performs put, streamed get, delete and head on a 10 MB object and passes
- [ ] The finding (works / works with caveats / does not work, with the replacement) is recorded under `## Comments` in this file

## Notes

- Spec sections: Ports and adapters, Further Notes - To verify at project setup
- Presigning is not needed (spec Files), so it is not tested
