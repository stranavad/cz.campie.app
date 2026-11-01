import * as p from 'drizzle-orm/pg-core';

import type { Encrypted } from '../../core/encryption/cipher.ts';

// A column the application encrypts with the Organisation's data key; it takes and gives only ciphertext.
export const encrypted = () => p.bytea().$type<Encrypted>();
