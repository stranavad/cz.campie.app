// The tabs of a Camp's settings, in their order; the address names the open one (?sekce=turnusy).
export const CAMP_SETTINGS_SECTIONS = [
  'zaklad',
  'vzhled',
  'turnusy',
  'formular',
  'emaily',
  'slevy',
  'souhlasy',
  'dokumenty',
] as const;

export type CampSettingsSection = (typeof CAMP_SETTINGS_SECTIONS)[number];
