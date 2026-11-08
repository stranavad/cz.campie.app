import { z } from 'zod';

const BLACK = '#000000';
const WHITE = '#ffffff';
// The dark theme's card surface, the darkest place an accent sits on in the frontend.
export const DARK_SURFACE = '#1f1c19';
// WCAG 2 level AA for normal text.
const READABLE_CONTRAST = 4.5;
const SHADE_STEPS = 20;

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
  // The dark theme's accent: lightened just enough to read as text on the dark surface, so it also serves
  // as the dark theme's buttons, bars and borders.
  readonly darkAccent: string;
  // Text on the dark theme's accent.
  readonly onDarkAccent: string;
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
 * Mix a colour with black or white.
 * @param colour a six-digit hex colour
 * @param target the channel value mixed in: 0 for black, 255 for white
 * @param share how much of it, from 0 to 1
 */
function mix(colour: string, target: number, share: number): string {
  return `#${channelsOf(colour)
    .map((channel) =>
      Math.round(channel * (1 - share) + target * share)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/**
 * Mix a colour towards black or white in even steps until it reads on a background.
 * @param colour a six-digit hex colour
 * @param background the six-digit hex colour it must read on
 * @param target the channel value mixed in: 0 for black, 255 for white
 */
function readableOn(colour: string, background: string, target: number): string {
  const shades = Array.from({ length: SHADE_STEPS + 1 }, (_, step) => mix(colour, target, step / SHADE_STEPS));

  return (
    shades.find((shade) => contrastRatio(shade, background) >= READABLE_CONTRAST) ?? (target === 0 ? BLACK : WHITE)
  );
}

/**
 * Pick black or white text for a background, whichever contrasts more.
 * @param background a six-digit hex colour
 */
function textOn(background: string): string {
  return contrastRatio(WHITE, background) >= contrastRatio(BLACK, background) ? WHITE : BLACK;
}

/**
 * Derive the readable colours that go with an accent colour, so no accent makes a page illegible: black
 * or white text on it, whichever contrasts more (at least 4.58:1 for any colour), the accent darkened
 * until it reads on white, and for the dark theme the accent lightened until it reads on the dark surface.
 * @param accent a six-digit hex colour
 */
export function brandColours(accent: string): BrandColours {
  const darkAccent = readableOn(accent, DARK_SURFACE, 255);

  return {
    accent,
    onAccent: textOn(accent),
    accentText: readableOn(accent, WHITE, 0),
    darkAccent,
    onDarkAccent: textOn(darkAccent),
  };
}
