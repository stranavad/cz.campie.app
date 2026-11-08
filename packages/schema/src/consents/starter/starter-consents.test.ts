import { describe, expect, it } from 'vitest';

import { consentContentSchema } from '../consent/consent.resource.ts';
import { STARTER_CONSENTS } from './starter-consents.ts';

describe('STARTER_CONSENTS', () => {
  it.each(STARTER_CONSENTS)('$key opens as content the API publishes', (starter) => {
    const content = {
      title: starter.title,
      introduction: starter.introduction,
      withdrawable: starter.withdrawable,
      items: starter.items.map((item, index) => ({
        id: `0190a2b4-0000-7000-8000-${String(index).padStart(12, '0')}`,
        ...item,
      })),
      fileId: null,
    };

    expect(consentContentSchema.safeParse(content).error).toBeUndefined();
  });

  it('names no source camp, no organiser and uses no dash but a hyphen', () => {
    const texts = STARTER_CONSENTS.flatMap((starter) => [
      starter.title,
      starter.introduction,
      ...starter.items.map(({ text }) => text),
    ]).join('\n');

    expect(texts).not.toMatch(/domino|cvč|z\.\s?s\.|www\.|@|[–—]/iu);
  });
});
