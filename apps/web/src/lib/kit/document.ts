import { documentLabels } from '../../content/kit/documents/index.ts';
import type { DocBlock, DocField, DocItem, DocumentTemplate, KitSettings } from '../../content/kit/documents/types.ts';
import type { DocumentSlug } from '../../content/kit/types.ts';

// One model, three outputs: a template, the organiser's settings and their choices for the template
// become one printable document. The HTML preview (preview.ts), the PDF (pdf.ts) and the configurator
// all take this document; none of them reads the template on its own.

// An item the organiser wrote: printed like a template's item, without a `why`.
export interface CustomItem {
  id: string;
  title: string;
  text: string;
  kind: DocItem['kind'];
}

// What the organiser chose for one template. Items are the template's, by id; an edit replaces the
// item's title or text; custom items follow the template's.
export interface TemplateChoices {
  on: readonly string[];
  edits: Readonly<Record<string, { title: string; text: string }>>;
  custom: readonly CustomItem[];
  credit: boolean;
}

export type PrintBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'note'; text: string }
  // The organiser's and the camp's data as "label: value" lines.
  | { type: 'values'; lines: { label: string; value: string }[] }
  | { type: 'fields'; fields: readonly DocField[] }
  | { type: 'options'; items: readonly string[] }
  | { type: 'box'; title: string | null; blocks: PrintBlock[] }
  | {
      type: 'item';
      number: number;
      title: string;
      text: string;
      kind: DocItem['kind'];
      fields: readonly DocField[];
    }
  | { type: 'signature'; signers: readonly string[] };

export interface Letterhead {
  // A JPEG data URL (lib/kit/settings.ts).
  logo: string | null;
  name: string;
  lines: string[];
}

export interface PrintDocument {
  slug: DocumentSlug;
  kind: DocumentTemplate['kind'];
  letterhead: Letterhead | null;
  title: string;
  subtitle: string | null;
  blocks: PrintBlock[];
  // The small print at the bottom of each page.
  footer: string | null;
}

export const emptySettings: KitSettings = {
  organiser: { name: '', ico: '', address: '', email: '', phone: '', logo: null },
  camp: { name: '', term: '', place: '' },
};

// The preset: the template's default items, nothing edited or added, the credit line on.
export function presetChoices(template: DocumentTemplate): TemplateChoices {
  return {
    on: template.items.filter((item) => item.defaultOn).map((item) => item.id),
    edits: {},
    custom: [],
    credit: true,
  };
}

// A printed text split into runs: **bold** is the only markup.
export function textRuns(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter((part) => part !== '')
    .map((part) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}

// A text's paragraphs: each line of its own.
export function paragraphs(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function letterhead(settings: KitSettings): Letterhead | null {
  const { name, ico, address, email, phone, logo } = settings.organiser;
  if (name.trim() === '') {
    return null;
  }
  const contacts = [email, phone].map((part) => part.trim()).filter((part) => part !== '');
  const lines = [
    address.trim(),
    ico.trim() === '' ? '' : `${documentLabels.printed.ico}: ${ico.trim()}`,
    contacts.join(' · '),
  ].filter((line) => line !== '');
  return { logo, name: name.trim(), lines };
}

// The `event` block: the camp's values filled in, and for an empty one a line to fill in by hand where
// the template asks for it. The organiser is named by the letterhead, so it lists the camp only.
function eventBlocks(settings: KitSettings, blankWhenEmpty: boolean): PrintBlock[] {
  const { printed } = documentLabels;
  const entries = [
    { label: printed.camp, value: settings.camp.name },
    { label: printed.term, value: settings.camp.term },
    { label: printed.place, value: settings.camp.place },
  ].map((entry) => ({ label: entry.label, value: entry.value.trim() }));
  const filled = entries.filter((entry) => entry.value !== '');
  const blank = blankWhenEmpty ? entries.filter((entry) => entry.value === '') : [];
  return [
    ...(filled.length > 0 ? [{ type: 'values' as const, lines: filled }] : []),
    ...(blank.length > 0
      ? [{ type: 'fields' as const, fields: blank.map((entry): DocField => ({ label: entry.label, width: 'half' })) }]
      : []),
  ];
}

function fixedBlocks(blocks: readonly DocBlock[], settings: KitSettings): PrintBlock[] {
  return blocks.flatMap((block): PrintBlock[] => {
    switch (block.type) {
      case 'event':
        return eventBlocks(settings, block.blankWhenEmpty);
      case 'box':
        return [{ type: 'box', title: block.title ?? null, blocks: fixedBlocks(block.blocks, settings) }];
      case 'heading':
      case 'paragraph':
      case 'note':
      case 'fields':
      case 'options':
      case 'signature':
        return [block];
    }
  });
}

// The items in print: the template's that are on, in the template's order, with the organiser's
// wording, then the organiser's own. Empty ones are left out; all are numbered.
function itemBlocks(template: DocumentTemplate, choices: TemplateChoices): PrintBlock[] {
  const on = new Set(choices.on);
  const items = [
    ...template.items
      .filter((item) => on.has(item.id))
      .map((item) => ({
        title: choices.edits[item.id]?.title ?? item.title,
        text: choices.edits[item.id]?.text ?? item.text,
        kind: item.kind,
        fields: item.fields ?? [],
      })),
    ...choices.custom.map((item) => ({ title: item.title, text: item.text, kind: item.kind, fields: [] })),
  ].filter((item) => item.title.trim() !== '' || item.text.trim() !== '');
  return items.map((item, index) => ({
    type: 'item',
    number: index + 1,
    title: item.title.trim(),
    text: item.text,
    kind: item.kind,
    fields: item.fields,
  }));
}

// The document to print. A form prints as it stands: no letterhead, no choices, no credit line.
export function buildDocument(
  template: DocumentTemplate,
  settings: KitSettings,
  choices: TemplateChoices,
): PrintDocument {
  const isForm = template.kind === 'form';
  return {
    slug: template.slug,
    kind: template.kind,
    letterhead: isForm ? null : letterhead(settings),
    title: template.title,
    subtitle: template.subtitle ?? null,
    blocks: [
      ...fixedBlocks(template.before, isForm ? emptySettings : settings),
      ...(isForm ? [] : itemBlocks(template, choices)),
      ...fixedBlocks(template.after, isForm ? emptySettings : settings),
    ],
    footer: !isForm && choices.credit ? documentLabels.printed.credit : null,
  };
}

// The blank document of /vzory/<slug>.pdf and the page's static preview: the preset, no letterhead.
export function blankDocument(template: DocumentTemplate): PrintDocument {
  return buildDocument(template, emptySettings, presetChoices(template));
}

// A framed part that holds nothing but one line without a label writes its title on that line: "2. Účel
// vydání posudku ____".
type PrintBox = Extract<PrintBlock, { type: 'box' }>;

export function titleOnLine(box: PrintBox): box is PrintBox & { title: string } {
  const [only, ...rest] = box.blocks;
  return (
    box.title !== null &&
    rest.length === 0 &&
    only?.type === 'fields' &&
    only.fields.length === 1 &&
    only.fields[0]?.label === '' &&
    (only.fields[0].lines ?? 1) === 1
  );
}

// The units a document is paginated in: each block, a heading together with the block under it. A
// unit is kept on one page by the PDF and by the preview alike.
export function printUnits(blocks: readonly PrintBlock[]): PrintBlock[][] {
  const units: PrintBlock[][] = [];
  let pending: PrintBlock | null = null;
  for (const block of blocks) {
    if (pending !== null) {
      units.push([pending, block]);
      pending = null;
    } else if (block.type === 'heading') {
      pending = block;
    } else {
      units.push([block]);
    }
  }
  if (pending !== null) {
    units.push([pending]);
  }
  return units;
}

// A row of fill-in fields, each with its share of the row's width. A half-width field shares its row
// with the next half, or, when it would stand alone beside a full-width field, with that field, which
// then takes two thirds ("name" and "date of birth" on one line, "date" and "doctor's signature"). A
// half left alone keeps half the row.
export interface FieldCell {
  field: DocField;
  share: 1 | 2;
}

export type FieldRow = readonly [FieldCell] | readonly [FieldCell, FieldCell];

export function fieldRows(fields: readonly DocField[]): { cells: FieldRow; lone: boolean }[] {
  const rows: { cells: FieldRow; lone: boolean }[] = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const next = fields[index + 1];
    const after = fields[index + 2];
    if (field === undefined) {
      continue;
    }
    if (field.width === 'full') {
      if (next?.width === 'half' && after?.width !== 'half') {
        rows.push({
          cells: [
            { field, share: 2 },
            { field: next, share: 1 },
          ],
          lone: false,
        });
        index += 1;
      } else {
        rows.push({ cells: [{ field, share: 1 }], lone: false });
      }
    } else if (next?.width === 'full' && after?.width !== 'half') {
      rows.push({
        cells: [
          { field, share: 1 },
          { field: next, share: 2 },
        ],
        lone: false,
      });
      index += 1;
    } else if (next?.width === 'half') {
      rows.push({
        cells: [
          { field, share: 1 },
          { field: next, share: 1 },
        ],
        lone: false,
      });
      index += 1;
    } else {
      rows.push({ cells: [{ field, share: 1 }], lone: true });
    }
  }
  return rows;
}
