import { kitLabels } from '../../content/kit/hub.ts';
import { sources } from '../../content/kit/sources.ts';
import type { Basis, Cite, Fact, IsoDate, Source, SourceId, SourceKind } from '../../content/kit/types.ts';
import type { Inline } from '../../content/types.ts';
import { toHtml } from '../inline.ts';

// How a Fact reads on a page: its text, what kind of statement it is and the links to its sources.

export interface CiteLink {
  label: string;
  href: string;
}

// "1. 1. 2027", as Czech writes a date.
export function czechDate(date: IsoDate): string {
  const [year, month, day] = date.split('-');
  return `${Number(day)}. ${Number(month)}. ${year}`;
}

// "zák. č. 258/2000 Sb., § 9 odst. 3" to the source's page, at the paragraph when the source has anchors.
export function citeLink(cite: Cite): CiteLink {
  const source: Source = sources[cite.source];
  const anchor = cite.anchor !== undefined && source.anchors === true ? `#${cite.anchor}` : '';
  return {
    label: cite.at === undefined ? source.short : `${source.short}, ${cite.at}`,
    href: source.url + anchor,
  };
}

export interface FactView {
  // The text as written (for the Markdown twins) and rendered (for the pages).
  text: Inline;
  html: string;
  basis: Basis;
  basisLabel: string;
  // The basis's mark in a claim row: §, Ú, O or c.
  mark: string;
  cites: CiteLink[];
  // Before the citations: "vychází z" for our own advice, whose citations name the rule it builds on.
  citesPrefix: string | null;
  since: string | null;
  // The date tag of a claim row: "Novinka 2027" for a Fact in force from the season's start, otherwise
  // the `since` text; `isNew` marks the first.
  sinceTag: string | null;
  isNew: boolean;
  smallToo: string | null;
  quote: string | null;
}

export function factView(fact: Fact): FactView {
  const since = fact.since === undefined ? null : `${kitLabels.since} ${czechDate(fact.since)}`;
  const isNew = fact.since === kitLabels.newFrom;
  return {
    text: fact.text,
    html: toHtml(fact.text),
    basis: fact.basis,
    basisLabel: kitLabels.basis[fact.basis],
    mark: kitLabels.basisMark[fact.basis],
    cites: fact.cites.map(citeLink),
    citesPrefix: fact.basis === 'advice' ? kitLabels.adviceBasedOn : null,
    since,
    sinceTag: isNew ? kitLabels.newTag : since,
    isNew,
    smallToo: fact.smallToo === true ? kitLabels.smallToo : null,
    quote: fact.quote ?? null,
  };
}

// A count in Czech: "1 pravidlo", "3 pravidla", "12 pravidel".
export function czechCount(count: number, forms: readonly [string, string, string]): string {
  const form = count === 1 ? forms[0] : count >= 2 && count <= 4 ? forms[1] : forms[2];
  return `${count} ${form}`;
}

// The verification line of a kit page: the season, the day it was checked, the legal state.
export interface Verification {
  season: string;
  verified: string;
  legalState: string;
}

export function verification(date: IsoDate): Verification {
  return {
    season: kitLabels.season,
    verified: `${kitLabels.verified} ${czechDate(date)}`,
    legalState: kitLabels.legalState,
  };
}

// The legend of the four kinds of statement, in the order of kitLabels.
export const basisLegend = (Object.keys(kitLabels.basis) as Basis[]).map((basis) => ({
  basis,
  label: kitLabels.basis[basis],
  mark: kitLabels.basisMark[basis],
  text: kitLabels.basisLegend[basis],
}));

export interface SourceGroup {
  kind: SourceKind;
  title: string;
  sources: CiteLink[];
}

// The sources the given Facts cite, each once, grouped by kind in the order of kitLabels and listed in
// the registry's order.
export function citedSources(facts: readonly Fact[]): SourceGroup[] {
  const cited = new Set(facts.flatMap((fact) => fact.cites.map((cite) => cite.source)));
  const used = (Object.keys(sources) as SourceId[]).filter((id) => cited.has(id)).map((id): Source => sources[id]);
  return (Object.keys(kitLabels.sourceKind) as SourceKind[])
    .map((kind) => ({
      kind,
      title: kitLabels.sourceKind[kind],
      sources: used
        .filter((source) => source.kind === kind)
        .map((source) => ({ label: source.title, href: source.url })),
    }))
    .filter((group) => group.sources.length > 0);
}
