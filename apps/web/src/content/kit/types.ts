import type { Inline } from '../types.ts';
import type { sources } from './sources.ts';

// The starter kit for camp organisers: guides (/pruvodce) and document templates (/vzory). Its one rule:
// no statement without a source. A Fact cannot be written without at least one Cite, and a Cite can only
// name a Source of the registry, so a page cannot say something it cannot link.

export type IsoDate = `${number}-${number}-${number}`;

// law: a regulation in force. authority: a state body's interpretation or guidance. practice: what an
// established organisation recommends to its own camps.
export type SourceKind = 'law' | 'authority' | 'practice';

export interface Source {
  kind: SourceKind;
  // Full name, as in the list of sources at the end of a page.
  title: string;
  // Short name used inside a citation, e.g. "zák. č. 258/2000 Sb.".
  short: string;
  url: string;
  // For zakonyprolidi.cz pages: citations may carry an anchor ("p9-3" is § 9 odst. 3).
  anchors?: true;
}

export type SourceId = keyof typeof sources;

export interface Cite {
  source: SourceId;
  // Where in the source, as a reader would say it: "§ 9 odst. 3", "příloha č. 4", "čl. 13".
  at?: string;
  // The anchor on the source's page, without "#". Only for sources with `anchors`.
  anchor?: string;
}

// How binding a Fact is:
// - law: the regulation says so (also when it says nothing, and the Fact states that it is silent).
// - authority: a state body reads the regulation this way; not binding, but what an inspection follows.
// - practice: recommended by the cited organisation, not required.
// - advice: our own recommendation; its citations point at the rule it builds on.
export type Basis = 'law' | 'authority' | 'practice' | 'advice';

export interface Fact {
  text: Inline;
  basis: Basis;
  cites: readonly [Cite, ...Cite[]];
  // The regulation's own words, shown on request. Verbatim, never paraphrased.
  quote?: string;
  // In force from this date, shown with the Fact.
  since?: IsoDate;
  // What changed on that date, as a sentence that stands on its own. A Fact with it is listed among
  // the hub's changes; without it, a Fact with `since` is only dated where it stands.
  change?: Inline;
  // True when the Fact also binds a "jiná podobná akce" (fewer than 30 children or 5 days and less).
  smallToo?: true;
}

export interface GuideSection {
  // The fragment of the section's heading.
  id: string;
  title: string;
  intro?: Inline;
  facts: readonly Fact[];
}

export type GuideSlug =
  | 'zotavovaci-akce-nebo-jina-podobna-akce'
  | 'povinnosti-poradatele'
  | 'podminky-ucasti-deti'
  | 'vedouci-a-hlavni-vedouci'
  | 'vypis-z-rejstriku-trestu-pro-praci-s-detmi'
  | 'zdravotnik-a-lekarnicka'
  | 'ubytovani-a-hygiena'
  | 'stravovani'
  | 'rezim-dne-a-koupani'
  | 'osobni-udaje-a-fotografie'
  | 'komercni-tabor-a-zajezd';

export type DocumentSlug =
  | 'prohlaseni-o-bezinfekcnosti'
  | 'posudek-o-zdravotni-zpusobilosti-ditete'
  | 'souhlas-se-zpracovanim-osobnich-udaju'
  | 'souhlasy-rodicu-na-tabor';

export interface Guide {
  slug: GuideSlug;
  // Short name for lists, the breadcrumb and the Open Graph eyebrow.
  nav: string;
  // The page's h1.
  title: string;
  // <title> and meta description.
  seoTitle: string;
  description: string;
  lead: Inline;
  // One line for the hub's card.
  summary: string;
  sections: readonly GuideSection[];
  related: { guides: readonly GuideSlug[]; documents: readonly DocumentSlug[] };
  // The day the page was last checked against its sources.
  verified: IsoDate;
}

// A step of the hub's timeline: what to do when.
export interface TimelineStep {
  when: string;
  // When the step falls, counted from the camp's first day; the hub's deadline calculator turns it
  // into a date. Absent for the steps during and after the camp.
  offset?: { months: number } | { days: number };
  // The calculator's summary line names this step's date in these words, `{date}` standing for it.
  summary?: string;
  title: string;
  facts: readonly Fact[];
  links: { guides: readonly GuideSlug[]; documents: readonly DocumentSlug[] };
}

// The drawing on a guide's card or one of the hub's entry cards.
export type GuideIcon =
  | 'sign'
  | 'clip'
  | 'case'
  | 'child'
  | 'people'
  | 'shield'
  | 'cross'
  | 'tent'
  | 'pot'
  | 'sun'
  | 'lock'
  | 'calendar'
  | 'sheet';

// A group of guides, as the hub, the menu and the footer list them.
export interface GuideGroup {
  number: string;
  title: string;
  guides: readonly {
    slug: GuideSlug;
    icon: GuideIcon;
    // A shorter name for the menu, where the guide's `nav` is too long.
    menu?: string;
    // One line for the hub's card.
    card: string;
    // The guide's key numbers. Each is a statement the guide itself makes, with its source.
    chips: readonly string[];
    isNew?: true;
  }[];
}
