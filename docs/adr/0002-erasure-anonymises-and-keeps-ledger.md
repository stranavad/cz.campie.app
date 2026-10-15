# Erasure anonymises a Registration and keeps its payment ledger

Erasing a Registration deletes its personal data and every stored file but keeps an anonymous tombstone with price lines and the full payment ledger, and scrubs rather than deletes its audit entries. Camps keep accounts, payment records are accounting documents with a statutory retention period that GDPR erasure does not override, and the append-only audit log and never-deleted ledger would otherwise contradict erasure.

## Considered Options

- Hard delete including payments: leaves the camp's accounting with holes it must fill elsewhere.
- Block erasure while payments exist: makes a valid deletion request impossible to honour.
