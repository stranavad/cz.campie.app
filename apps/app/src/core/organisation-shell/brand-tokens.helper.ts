import type { CSSProperties } from 'react';

import { brandColours } from '@repo/schema/organisations';

// The Organisation's accent and the text colours derived for it, as the theme's tokens, so every component
// that uses tokens is branded and stays readable whatever the accent.
export function brandTokens(accentColour: string): CSSProperties {
  const { accent, onAccent, accentText } = brandColours(accentColour);

  return { '--primary': accent, '--primary-foreground': onAccent, '--ring': accentText } as CSSProperties;
}
