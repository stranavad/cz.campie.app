import { isDeepStrictEqual } from 'node:util';
import { ForbiddenException } from '@nestjs/common';
import { z } from 'zod';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  answerValueSchema,
  sensitiveKeys,
  type Answers,
  type FormDefinition,
  type SensitiveKeys,
} from '@repo/schema/form-engine';
import type { AccessErrorCode } from '@repo/schema/shared';

import type { OrganisationCipher } from '../../../core/encryption/cipher.ts';
import type { EncryptionService } from '../../../core/encryption/encryption.service.ts';
import type { StoredAnswers } from '../../../repositories/registrations/registration/registration.repository.ts';

const sealedSchema = z.record(z.string(), answerValueSchema);

/**
 * Get what opens stored answers for reading, with the Organisation's cipher fetched only when one of them
 * holds encrypted answers.
 * @param encryption the encryption service
 * @param stored the answers about to be read
 */
export async function answerOpener(
  encryption: EncryptionService,
  stored: readonly StoredAnswers[],
): Promise<(answers: StoredAnswers) => Answers> {
  const cipher = stored.some(({ encryptedAnswers }) => encryptedAnswers !== null) ? await encryption.cipher() : null;

  return (answers) => (cipher === null ? answers.answers : openAnswers(cipher, answers));
}

/**
 * Split answers for storing: the plain ones as they are, the encrypted and health ones sealed together as
 * one value, or none when there are none.
 * @param cipher the Organisation's cipher
 * @param answers the answers beyond the core
 * @param sensitive the keys that are not plain
 */
export function sealAnswers(cipher: OrganisationCipher, answers: Answers, sensitive: SensitiveKeys): StoredAnswers {
  const plain = Object.entries(answers).filter(([key]) => !sensitive.has(key));
  const sealed = Object.entries(answers).filter(([key]) => sensitive.has(key));

  return {
    answers: Object.fromEntries(plain),
    encryptedAnswers: sealed.length === 0 ? null : cipher.encrypt(JSON.stringify(Object.fromEntries(sealed))),
  };
}

/**
 * Join stored answers back into one set: the plain ones with the sealed ones opened.
 * @param cipher the Organisation's cipher
 * @param stored the answers as stored
 */
export function openAnswers(cipher: OrganisationCipher, stored: StoredAnswers): Answers {
  return openForChange(cipher, stored).answers;
}

// Stored answers opened for a change: as stored, all of them joined, and the sealed ones alone.
export interface OpenedAnswers {
  readonly stored: StoredAnswers;
  readonly answers: Answers;
  readonly sealed: Answers;
}

/**
 * Open stored answers for a change, keeping what was sealed, which stays sealed whatever the form says now.
 * @param cipher the Organisation's cipher
 * @param stored the answers as stored
 */
export function openForChange(cipher: OrganisationCipher, stored: StoredAnswers): OpenedAnswers {
  const sealed =
    stored.encryptedAnswers === null ? {} : sealedSchema.parse(JSON.parse(cipher.decrypt(stored.encryptedAnswers)));

  return { stored, answers: { ...stored.answers, ...sealed }, sealed };
}

/**
 * Name the sensitive keys a change of stored answers must keep from plain storage and audit values: those of
 * every published version of the form, and any key sealed already, which only a removed custom health field
 * can be, since the catalogue names every standard one.
 * @param published every published version of the Camp's form
 * @param opened the answers being changed
 */
export function sensitiveForChange(
  published: readonly FormDefinition[],
  opened: readonly OpenedAnswers[],
): SensitiveKeys {
  const keys = new Map(sensitiveKeys(published, REGISTRATION_FIELD_CATALOGUE));

  for (const key of opened.flatMap(({ sealed }) => Object.keys(sealed))) {
    if (!keys.has(key)) {
      keys.set(key, 'health');
    }
  }

  return keys;
}

/**
 * Split changed answers for storing as sealAnswers does, sealing every key sealed before too, and keep the
 * stored ciphertext when the sealed answers are as they were, so an audit entry sees no change of them.
 * @param cipher the Organisation's cipher
 * @param opened the answers as opened before the change
 * @param answers the answers after the change
 * @param sensitive the keys that are not plain
 */
export function resealAnswers(
  cipher: OrganisationCipher,
  opened: OpenedAnswers,
  answers: Answers,
  sensitive: SensitiveKeys,
): StoredAnswers {
  const isSealed = (key: string) => sensitive.has(key) || Object.hasOwn(opened.sealed, key);
  const plain = Object.fromEntries(Object.entries(answers).filter(([key]) => !isSealed(key)));
  const sealed = Object.fromEntries(Object.entries(answers).filter(([key]) => isSealed(key)));

  if (isDeepStrictEqual(sealed, opened.sealed)) {
    return { answers: plain, encryptedAnswers: opened.stored.encryptedAnswers };
  }

  return {
    answers: plain,
    encryptedAnswers: Object.keys(sealed).length === 0 ? null : cipher.encrypt(JSON.stringify(sealed)),
  };
}

/**
 * Tell whether changed answers would be stored as they are already.
 * @param opened the answers as opened before the change
 * @param stored the answers to store
 */
export function unchanged(opened: OpenedAnswers, stored: StoredAnswers): boolean {
  return (
    stored.encryptedAnswers === opened.stored.encryptedAnswers &&
    isDeepStrictEqual(stored.answers, opened.stored.answers)
  );
}

/**
 * Name the sensitive answers that differ between two sets, for the audit entry, which never holds their
 * values.
 * @param before the answers before
 * @param after the answers after
 * @param sensitive the keys that are not plain
 */
export function changedSensitive(before: Answers, after: Answers, sensitive: SensitiveKeys): string[] {
  return [...sensitive.keys()].filter((key) => !isDeepStrictEqual(before[key] ?? null, after[key] ?? null));
}

/**
 * Refuse an admin's answers to health fields, given or cleared, without Health write.
 * @param mayWrite whether the admin holds Health write
 * @param answerSets the answers sent
 * @param sensitive the keys that are not plain
 * @throws {ForbiddenException} permission_denied when a health answer is among them
 */
export function ensureHealthWritable(
  mayWrite: boolean,
  answerSets: readonly Answers[],
  sensitive: SensitiveKeys,
): void {
  if (!mayWrite && answerSets.some((answers) => Object.keys(answers).some((key) => sensitive.get(key) === 'health'))) {
    const code: AccessErrorCode = 'permission_denied';

    throw new ForbiddenException({ code, message: 'Health data needs Health write' });
  }
}

/**
 * Leave health data out of answers, for whoever may not read it.
 * @param answers the answers
 * @param sensitive the keys that are not plain
 */
export function withoutHealth(answers: Answers, sensitive: SensitiveKeys): Answers {
  return Object.fromEntries(Object.entries(answers).filter(([key]) => sensitive.get(key) !== 'health'));
}
