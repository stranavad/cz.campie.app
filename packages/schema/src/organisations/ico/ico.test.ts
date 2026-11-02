import { describe, expect, it } from 'vitest';

import { icoSchema } from './ico.ts';

describe('icoSchema', () => {
  it.each(['45274649', '12345679', '00000019'])('accepts %s, whose check digit matches', (ico) => {
    expect(icoSchema.safeParse(ico).success).toBe(true);
  });

  it('accepts one written with spaces, without them', () => {
    expect(icoSchema.parse(' 452 74 649 ')).toBe('45274649');
  });

  it.each(['12345678', '4527464', '452746490', 'abcdefgh'])('rejects %s', (ico) => {
    expect(icoSchema.safeParse(ico).error?.issues).toEqual([expect.objectContaining({ message: 'ico_invalid' })]);
  });
});
