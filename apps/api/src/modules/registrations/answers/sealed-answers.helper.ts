import { isDeepStrictEqual } from 'node:util';
import { ForbiddenException } from '@nestjs/common';
import { z } from 'zod';

import { answerValueSchema, type Answers, type SensitiveKeys } from '@repo/schema/form-engine';
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
  return stored.encryptedAnswers === null
    ? stored.answers
    : { ...stored.answers, ...sealedSchema.parse(JSON.parse(cipher.decrypt(stored.encryptedAnswers))) };
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
