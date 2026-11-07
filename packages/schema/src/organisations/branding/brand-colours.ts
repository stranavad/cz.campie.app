import { z } from 'zod';

const BLACK = '#000000';
const WHITE = '#ffffff';
// WCAG 2 level AA for normal text.
const READABLE_CONTRAST = 4.5;
const DARKENING_STEPS = 20;

// An accent colour as a lowercase six-digit hex colour; it is written into pages', emails' and documents'
// CSS, so nothing else is accepted.
export const accentColourSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => /^#[0-9a-f]{6}$/.test(value), 'accent_colour_invalid');

export type BrandColours = {
  // The accent itself: buttons, bars, borders.
  readonly accent: string;
  // Text on the accent.
  readonly onAccent: string;
  // The accent as text or a link on the white page, darkened just enough to stay readable.
  readonly accentText: string;
};

/**
 * Read a hex colour's channels as 0 to 255.
 * @param colour a six-digit hex colour
 */
function channelsOf(colour: string): [number, number, number] {
  const value = Number.parseInt(colour.slice(1), 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * Compute a colour's relative luminance, as WCAG 2 defines it.
 * @param colour a six-digit hex colour
 */
function luminanceOf(colour: string): number {
  const [red, green, blue] = channelsOf(colour).map((channel) => {
    const linear = channel / 255;

    return linear <= 0.03928 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * Compute the WCAG 2 contrast ratio of two colours, from 1 to 21.
 * @param first a six-digit hex colour
 * @param second a six-digit hex colour
 */
export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminanceOf(first), luminanceOf(second)].toSorted((a, b) => b - a) as [number, number];

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Mix a colour with black.
 * @param colour a six-digit hex colour
 * @param share how much black, from 0 to 1
 */
function darken(colour: string, share: number): string {
  return `#${channelsOf(colour)
    .map((channel) =>
      Math.round(channel * (1 - share))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/**
 * Derive the readable colours that go with an accent colour, so no accent makes a page illegible: black
 * or white text on it, whichever contrasts more (at least 4.58:1 for any colour), and the accent darkened
 * until it reads on white.
 * @param accent a six-digit hex colour
 */
export function brandColours(accent: string): BrandColours {
  const onAccent = contrastRatio(WHITE, accent) >= contrastRatio(BLACK, accent) ? WHITE : BLACK;
  const shades = Array.from({ length: DARKENING_STEPS + 1 }, (_, step) => darken(accent, step / DARKENING_STEPS));
  const accentText = shades.find((shade) => contrastRatio(shade, WHITE) >= READABLE_CONTRAST) ?? BLACK;

  return { accent, onAccent, accentText };
}
