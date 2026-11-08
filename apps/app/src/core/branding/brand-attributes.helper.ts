import type { CSSProperties } from 'react';

import { brandColours } from '@repo/schema/organisations';

// Brands an element and everything inside it with an accent colour: spread onto the element. The light
// and dark theme sets go in together and index.css picks the one for the current theme, so the theme can
// switch without a re-render and every component using the brand tokens stays readable whatever the accent.
export function brandAttributes(accentColour: string): { 'data-brand': ''; style: CSSProperties } {
  const { accent, onAccent, accentText, darkAccent, onDarkAccent } = brandColours(accentColour);

  return {
    'data-brand': '',
    style: {
      '--brand-light': accent,
      '--brand-light-foreground': onAccent,
      '--brand-light-text': accentText,
      '--brand-dark': darkAccent,
      '--brand-dark-foreground': onDarkAccent,
    } as CSSProperties,
  };
}
