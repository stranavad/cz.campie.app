import type { Choice } from '@/core/registration-form/hooks/use-choices.hook';

/**
 * Tell whether a standard choice fits as tappable chips, else the phone's own picker: few, short options.
 * @param choices the field's options
 */
export function fitsChips(choices: readonly Choice[]): boolean {
  return choices.length > 0 && choices.length <= 12 && choices.every(({ label }) => label.length <= 28);
}
