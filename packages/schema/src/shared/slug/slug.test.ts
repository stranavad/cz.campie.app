import { describe, expect, it } from 'vitest';

import { slugify } from './slug.ts';

describe('slugify', () => {
  it.each([
    ['Letní tábor Pokusník', 'letni-tabor-pokusnik'],
    ['  Tábory -- Online! ', 'tabory-online'],
    ['Žluťoučký kůň 2027', 'zlutoucky-kun-2027'],
    ['!!!', ''],
  ])('writes %j as %j', (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });
});
