import { describe, expect, it } from 'vitest';

import { vocativeOf } from './vocative.ts';

describe('vocativeOf', () => {
  it.each([
    ['Jana', 'Jano'],
    ['Tereza', 'Terezo'],
    ['Honza', 'Honzo'],
    ['Lucie', 'Lucie'],
    ['Jiří', 'Jiří'],
    ['Petr', 'Petře'],
    ['Alexandr', 'Alexandře'],
    ['Igor', 'Igore'],
    ['Tomáš', 'Tomáši'],
    ['Ondřej', 'Ondřeji'],
    ['Denis', 'Denisi'],
    ['Marek', 'Marku'],
    ['Vašek', 'Vašku'],
    ['Zdeněk', 'Zdeňku'],
    ['Dominik', 'Dominiku'],
    ['Vojtěch', 'Vojtěchu'],
    ['Pavel', 'Pavle'],
    ['Karel', 'Karle'],
    ['Daniel', 'Danieli'],
    ['Jan', 'Jane'],
    ['Jakub', 'Jakube'],
    ['Michal', 'Michale'],
    ['Vít', 'Víte'],
    ['JANA', 'JANO'],
    ['ZDENĚK', 'ZDEŇKU'],
  ])('calls %s %s', (name, vocative) => {
    expect(vocativeOf(name)).toBe(vocative);
  });

  it.each(['Nikol', 'Dagmar', 'Ester', 'Carmen', 'Doris', 'Hugo', 'Xi'])('leaves %s as it is', (name) => {
    expect(vocativeOf(name)).toBe(name);
  });
});
