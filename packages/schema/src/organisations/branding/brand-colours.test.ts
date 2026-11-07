import { describe, expect, it } from 'vitest';

import { accentColourSchema, brandColours, contrastRatio } from './brand-colours.ts';

const WHITE = '#ffffff';
const AA = 4.5;

// Every colour on a grid of 16 steps per channel, 4096 in all, the extremes included.
const GRID = Array.from({ length: 16 ** 3 }, (_, index) => {
  const channel = (shift: number) => (((index >> shift) & 15) * 17).toString(16).padStart(2, '0');

  return `#${channel(8)}${channel(4)}${channel(0)}`;
});

describe('contrastRatio', () => {
  it('measures as WCAG defines it', () => {
    expect(contrastRatio('#000000', WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', WHITE)).toBeCloseTo(4.54, 2);
  });
});

describe('brandColours', () => {
  it('makes text on any accent, and the accent as text on white, meet WCAG AA', () => {
    const unreadable = GRID.filter((accent) => {
      const { onAccent, accentText } = brandColours(accent);

      return contrastRatio(onAccent, accent) < AA || contrastRatio(accentText, WHITE) < AA;
    });

    expect(unreadable).toEqual([]);
  });

  it('writes white on a dark accent and black on a light one', () => {
    expect(brandColours('#1d3557').onAccent).toBe(WHITE);
    expect(brandColours('#ffd60a').onAccent).toBe('#000000');
  });

  it('keeps an accent that is already readable on white as text, and darkens a light one', () => {
    expect(brandColours('#1d3557').accentText).toBe('#1d3557');
    expect(brandColours('#ffd60a').accentText).not.toBe('#ffd60a');
  });
});

describe('accentColourSchema', () => {
  it('takes a hex colour, trimmed and lowercased', () => {
    expect(accentColourSchema.parse(' #1D3557 ')).toBe('#1d3557');
  });

  it.each(['1d3557', '#1d355', '#1d35577', 'red', '#1d3557; background: url(x)'])('rejects %s', (input) => {
    expect(accentColourSchema.safeParse(input).error?.issues).toEqual([
      expect.objectContaining({ message: 'accent_colour_invalid' }),
    ]);
  });
});
