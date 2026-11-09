import { accentColourSchema, brandColours, contrastRatio, DARK_SURFACE } from '@repo/schema/organisations';

// What an accent turns into, or null while the typed colour can't be read yet.
export function useAccentCheck(accentColour: string) {
  const parsed = accentColourSchema.safeParse(accentColour);

  if (!parsed.success) {
    return null;
  }

  const { accent, onAccent, darkAccent } = brandColours(parsed.data);

  return {
    // The dark surface takes light text, so text matching it is the light one.
    hasLightText: onAccent === brandColours(DARK_SURFACE).onAccent,
    contrast: contrastRatio(accent, onAccent),
    darkAccent,
  };
}
