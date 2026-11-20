import { z } from 'zod/mini';

import type { KitSettings } from '../../content/kit/documents/types.ts';
import type { DocumentSlug } from '../../content/kit/types.ts';
import { emptySettings, type TemplateChoices } from './document.ts';

// What the configurator keeps in the browser: the organiser and the camp, shared by every template, and
// per template what was chosen. One versioned key; a stored value that does not parse against the
// current schema is dropped, not migrated.

export const STORAGE_KEY = 'campie-vzory-v1';

// zod/mini: the same schemas as Zod's, a fraction of its size in the configurator's bundle.
const short = z.string().check(z.maxLength(300));
const long = z.string().check(z.maxLength(4000));

// The logo as the configurator keeps it: a JPEG the browser has already downscaled (from a PNG or a
// JPEG). Nothing else is ever put into an <img> or a PDF.
export const LOGO_PATTERN = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/;

const settingsSchema = z.object({
  organiser: z.object({
    name: short,
    ico: short,
    address: short,
    email: short,
    phone: short,
    logo: z.nullable(z.string().check(z.maxLength(2_000_000), z.regex(LOGO_PATTERN))),
  }),
  camp: z.object({ name: short, term: short, place: short }),
}) satisfies z.ZodMiniType<KitSettings>;

const choicesSchema = z.object({
  on: z.array(short).check(z.maxLength(100)),
  edits: z.record(short, z.object({ title: short, text: long })),
  custom: z
    .array(z.object({ id: short, title: short, text: long, kind: z.enum(['choice', 'statement']) }))
    .check(z.maxLength(50)),
  credit: z.boolean(),
}) satisfies z.ZodMiniType<TemplateChoices>;

const storedSchema = z.object({
  settings: settingsSchema,
  templates: z.record(z.string(), choicesSchema),
});

export interface Stored {
  settings: KitSettings;
  templates: Partial<Record<DocumentSlug, TemplateChoices>>;
}

export function parseStored(raw: string | null): Stored {
  if (raw === null) {
    return { settings: emptySettings, templates: {} };
  }
  try {
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? { settings: parsed.data.settings, templates: parsed.data.templates }
      : { settings: emptySettings, templates: {} };
  } catch {
    return { settings: emptySettings, templates: {} };
  }
}

// Storage may be off (private mode, a full quota): then the configurator still works, it only forgets.
export function loadStored(): Stored {
  try {
    return parseStored(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return parseStored(null);
  }
}

export function saveStored(stored: Stored): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Nothing to do: the document is still made from what is on the screen.
  }
}
