import { describe, expect, it } from 'vitest';

import { campSlugProblem, campSlugSchema } from './camp-slug.ts';

describe('campSlugProblem', () => {
  it.each(['letni-tabor', 'tabor2027', 'a'])('accepts %s', (slug) => {
    expect(campSlugProblem(slug)).toBeNull();
  });

  it.each(['Letni', 'letní', '-tabor', 'tabor-', 'letni--tabor', 'letni tabor', '', 'a'.repeat(81)])(
    'refuses %s as malformed',
    (slug) => {
      expect(campSlugProblem(slug)).toBe('camp_slug_malformed');
    },
  );

  it.each(['portal', 'api', 'prihlaseni'])('refuses %s, a path of the subdomain', (slug) => {
    expect(campSlugProblem(slug)).toBe('camp_slug_reserved');
  });
});

describe('campSlugSchema', () => {
  it('takes a slug typed with capitals and spaces around it, lowercased', () => {
    expect(campSlugSchema.parse(' Letni-Tabor ')).toBe('letni-tabor');
  });
});
