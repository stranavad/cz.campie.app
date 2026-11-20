import { documentBySlug } from '../../content/kit/document-list.ts';
import { guideBySlug } from '../../content/kit/guides/index.ts';
import { hub, kitLabels } from '../../content/kit/hub.ts';
import { guideIcons } from '../../content/kit/icons.ts';
import type { DocumentSlug, GuideGroup, GuideSlug } from '../../content/kit/types.ts';
import { guideKey, pages } from '../../content/seo.ts';
import { czechCount } from './facts.ts';

// Links between the kit's pages: the guides from the page registry, the templates under /vzory.

export function guideHref(slug: GuideSlug): string {
  return pages[guideKey(slug)].path;
}

export function documentHref(slug: DocumentSlug): string {
  return `${hub.documents.all.href}/${slug}`;
}

// The blank PDF of a template, generated at build time next to its page.
export function documentPdfHref(slug: DocumentSlug): string {
  return `${documentHref(slug)}.pdf`;
}

export interface KitCard {
  title: string;
  summary: string;
  // What the card leads to: a guide, or what kind of template.
  tag: string | null;
  href: string;
  action: string;
}

export function guideCard(slug: GuideSlug): KitCard {
  const guide = guideBySlug[slug];
  return { title: guide.nav, summary: guide.summary, tag: null, href: guideHref(slug), action: kitLabels.readGuide };
}

export function documentCard(slug: DocumentSlug): KitCard {
  const item = documentBySlug[slug];
  return {
    title: item.nav,
    summary: item.summary,
    tag: kitLabels.documentKind[item.kind],
    href: documentHref(slug),
    action: kitLabels.openDocument,
  };
}

// The guides in the order of the hub's groups, each with its group's entry (icon, card line, chips).
export type GuideEntry = GuideGroup['guides'][number];

const groups: readonly GuideGroup[] = hub.guides.groups;
export const guideEntries: readonly GuideEntry[] = groups.flatMap((group) => group.guides);

const guideEntryBySlug = Object.fromEntries(guideEntries.map((entry) => [entry.slug, entry])) as Record<
  GuideSlug,
  GuideEntry
>;

// A guide as the design's guide card: its drawing, a "Novinka 2027" tag, the name, one line, the key
// numbers and how many rules and templates it holds.
export interface GuideCardView {
  title: string;
  summary: string;
  href: string;
  icon: string;
  newTag: string | null;
  chips: readonly string[];
  count: string;
}

export function guideCardView(slug: GuideSlug): GuideCardView {
  const guide = guideBySlug[slug];
  const entry = guideEntryBySlug[slug];
  const rules = guide.sections.reduce((sum, section) => sum + section.facts.length, 0);
  const templates = guide.related.documents.length;
  return {
    title: guide.nav,
    summary: entry.card,
    href: guideHref(slug),
    icon: guideIcons[entry.icon],
    newTag: entry.isNew === true ? kitLabels.newTag : null,
    chips: entry.chips,
    count: [
      czechCount(rules, kitLabels.rulesPlural),
      ...(templates > 0 ? [czechCount(templates, kitLabels.templatesPlural)] : []),
    ].join(' · '),
  };
}

// A template as the design's template card: a drawn sheet, the name and what kind of template it is.
export interface TemplateCardView {
  title: string;
  summary: string;
  href: string;
  kind: 'form' | 'generator';
  tag: string;
  // An official form's tag is outlined.
  tagTone: 'plain' | 'outline';
}

export function templateCardView(slug: DocumentSlug): TemplateCardView {
  const item = documentBySlug[slug];
  return {
    title: item.nav,
    summary: item.summary,
    href: documentHref(slug),
    kind: item.kind,
    tag: kitLabels.documentKind[item.kind],
    tagTone: item.kind === 'form' ? 'outline' : 'plain',
  };
}
