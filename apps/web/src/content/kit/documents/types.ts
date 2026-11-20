import type { DocumentSlug, Fact, GuideSlug, IsoDate } from '../types.ts';

// A document template of /vzory: what is printed, and why each part is there. One model feeds the
// page's preview, the configurator and the PDF, so the three cannot drift apart.
//
// Texts here are printed on paper. They are plain text, with **bold** as the only markup, and they
// never take the camp's name into a sentence: the organiser's and the camp's data are shown as
// "label: value" lines by the `event` block, so nothing needs Czech declension.

// A line to fill in by hand. `lines` above 1 leaves room for a longer answer. `inline` sets a short label
// on its line's left, the line filling the rest of the row, instead of above it.
export interface DocField {
  label: string;
  width: 'full' | 'half';
  lines?: number;
  inline?: boolean;
}

export type DocBlock =
  // A section heading inside the document.
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  // Small print: how to fill the document in, a deadline.
  | { type: 'note'; text: string }
  // The camp, its dates and place as "label: value" lines (the letterhead names the organiser). An empty value prints
  // nothing in a customised document, and a blank line to fill in when `blankWhenEmpty` is set.
  | { type: 'event'; blankWhenEmpty: boolean }
  | { type: 'fields'; fields: readonly DocField[] }
  // Lettered options one of which is marked by hand: "a) je zdravotně způsobilé", side by side in one row.
  | { type: 'options'; items: readonly string[] }
  // A framed part of a form, as the prescribed forms are drawn.
  | { type: 'box'; title?: string; blocks: readonly DocBlock[] }
  // Place, date and the signature line(s).
  | { type: 'signature'; signers: readonly string[] };

// A part of a template the organiser may leave out, reword or add to.
export interface DocItem {
  id: string;
  title: string;
  // What the guardian reads. Line breaks separate paragraphs; the organiser may edit it.
  text: string;
  // choice: the guardian ticks "souhlasím" or "nesouhlasím". statement: the guardian signs under it.
  kind: 'choice' | 'statement';
  // Lines to fill in under the item.
  fields?: readonly DocField[];
  // Part of the preset the configurator starts from.
  defaultOn: boolean;
  // Why the item is offered and what it rests on. Shown beside the item, never printed.
  why: Fact;
}

export interface DocumentTemplate {
  slug: DocumentSlug;
  // The page: <title>, description, h1 and lead.
  seoTitle: string;
  description: string;
  pageTitle: string;
  lead: string;
  // The printed document: its heading and the line under it.
  title: string;
  subtitle?: string;
  // form: wording prescribed by a regulation, printed as it stands, without the organiser's
  // letterhead. template: starts with the letterhead when the organiser filled it in.
  kind: 'form' | 'template';
  before: readonly DocBlock[];
  items: readonly DocItem[];
  after: readonly DocBlock[];
  // What the page says about the document: guide sections shown under it, then its own Facts.
  explain: {
    title: string;
    sections: readonly { guide: GuideSlug; section: string }[];
    facts: readonly Fact[];
    // The one rule the page's hero answers with: a Fact of a guide section above (by its place in the
    // section) or, without `section`, of `facts`.
    answer: { section?: { guide: GuideSlug; id: string }; index: number };
  };
  // What Campie does with this paper, shown after a download.
  inCampie: string;
  related: { guides: readonly GuideSlug[]; documents: readonly DocumentSlug[] };
  verified: IsoDate;
}

// What the organiser types into the configurator. Kept in the browser only.
export interface KitSettings {
  organiser: { name: string; ico: string; address: string; email: string; phone: string; logo: string | null };
  camp: { name: string; term: string; place: string };
}
