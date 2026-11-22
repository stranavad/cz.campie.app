import { contact } from '../content/contact.ts';
import { features } from '../content/features.ts';
import { home } from '../content/home.ts';
import { documentLabels, templateBySlug } from '../content/kit/documents/index.ts';
import { guideBySlug } from '../content/kit/guides/index.ts';
import { hub, kitLabels } from '../content/kit/hub.ts';
import type { DocumentSlug, GuideSlug } from '../content/kit/types.ts';
import { security } from '../content/security.ts';
import {
  documentSlug,
  guideSlug,
  indexedPageKeys,
  isDocumentKey,
  isGuideKey,
  pages,
  type IndexedPageKey,
  type SitePageKey,
} from '../content/seo.ts';
import { ctaBand, footer, site } from '../content/site.ts';
import type { Cta } from '../content/types.ts';
import { absoluteHref } from './href.ts';
import { toMarkdown } from './inline.ts';
import { blankDocument, paragraphs, type PrintBlock } from './kit/document.ts';
import { basisLegend, factView, type CiteLink, type FactView } from './kit/facts.ts';
import { documentPage, documentsIndexPage, guidePage, hubPage } from './kit/pages.ts';
import { webyMarkdown } from './markdown-weby.ts';

// The Markdown twins of the indexed pages (/<slug>.md) and llms.txt, built from the same content as the
// pages, so they never drift apart.

const link = (cta: Cta) => `[${cta.label}](${absoluteHref(cta.href)})`;
const list = (items: readonly string[]) => items.map((item) => `- ${toMarkdown(item)}`).join('\n');
const doc = (blocks: readonly string[]) => `${blocks.join('\n\n')}\n`;

const closing = [`## ${ctaBand.title}`, ctaBand.text, `${link(ctaBand.primary)} · ${link(ctaBand.secondary)}`];

function homeMarkdown(): string {
  const { hero, pains, year, parents, money, consents, brand, team, roadmap, testimonials, dataSafety } = home;
  return doc([
    `# ${hero.titleLines.join(' ')}`,
    hero.lead,
    `${link(hero.primary)} · ${link(hero.secondary)}`,
    `## ${pains.title}`,
    list(pains.items),
    pains.closing,
    `## ${year.title}`,
    ...year.steps.flatMap((step, index) => [
      `### ${index + 1}. ${step.season}: ${step.title}${'planned' in step ? ` (${year.plannedLabel})` : ''}`,
      step.text,
    ]),
    `## ${parents.title}`,
    parents.note,
    parents.aside,
    parents.steps.map((step, index) => `${index + 1}. ${step.text}`).join('\n'),
    `## ${money.title}`,
    list(money.items),
    `## ${consents.title}`,
    list(consents.items),
    `## ${brand.title}`,
    list(brand.items),
    `## ${team.title}`,
    team.lead,
    list(team.roles.map((role) => `**${role.role}:** ${role.summary}`)),
    `## ${roadmap.title}`,
    roadmap.lead,
    ...roadmap.items.flatMap((item) => [`### ${item.when}: ${item.title}`, item.text]),
    roadmap.disclaimer,
    `### ${roadmap.missing.title}`,
    `${roadmap.missing.text} ${link(roadmap.missing.cta)}`,
    `## ${testimonials.title}`,
    toMarkdown(testimonials.lead),
    ...testimonials.items.map((item) => `> „${item.quote}“\n>\n> ${item.name}, ${toMarkdown(item.role)}`),
    `## ${dataSafety.title}`,
    list(dataSafety.points),
    link(dataSafety.link),
    `## ${home.faq.title}`,
    ...home.faq.items.flatMap((item) => [`### ${item.question}`, toMarkdown(item.answer)]),
    ...closing,
  ]);
}

function featuresMarkdown(): string {
  return doc([
    `# ${features.hero.title}`,
    features.hero.lead,
    ...features.groups.flatMap((group) => [
      `## ${group.title}`,
      group.lead,
      ...group.items.flatMap((item) => [`### ${item.title}`, toMarkdown(item.text)]),
    ]),
    ...closing,
  ]);
}

function securityMarkdown(): string {
  return doc([
    `# ${security.hero.title}`,
    security.hero.lead,
    ...security.items.flatMap((item) => [`## ${item.title}`, toMarkdown(item.text)]),
    security.links.map(link).join(' · '),
  ]);
}

function contactMarkdown(): string {
  return doc([
    `# ${contact.hero.title}`,
    contact.hero.lead,
    `E-mail: [${contact.email}](mailto:${contact.email})`,
    `## ${contact.about.title}`,
    `${contact.about.name}, ${contact.about.ico}. ${contact.about.text}`,
  ]);
}

// The kit's pages. A Fact is a list item: its text, then what kind of statement it is and its sources as
// links, then the regulation's own words as a quote.
const absolute = (item: CiteLink) => `[${item.label}](${absoluteHref(item.href)})`;

function factMarkdown(fact: FactView): string {
  const meta = [fact.basisLabel, fact.since, fact.smallToo, ...fact.cites.map(absolute)].filter(
    (part) => part !== null,
  );
  const quote = fact.quote === null ? [] : [`  > ${fact.quote}`];
  return [`- ${toMarkdown(fact.text)}`, `  ${meta.join(' · ')}`, ...quote].join('\n');
}

const legendMarkdown = [
  `## ${kitLabels.legendTitle}`,
  list([
    ...basisLegend.map((item) => `**${item.label}:** ${item.text}`),
    `**${kitLabels.smallToo}:** ${kitLabels.smallTooLegend}`,
  ]),
];

function guideMarkdown(slug: GuideSlug): string {
  const guide = guideBySlug[slug];
  const page = guidePage(slug);
  return doc([
    `# ${page.title}`,
    toMarkdown(guide.lead),
    page.verified,
    ...legendMarkdown,
    ...guide.sections.flatMap((section) => [
      `## ${section.title}`,
      ...(section.intro === undefined ? [] : [toMarkdown(section.intro)]),
      section.facts.map((fact) => factMarkdown(factView(fact))).join('\n'),
    ]),
    `## ${kitLabels.relatedGuides}`,
    list(page.relatedGuides.map((card) => `${absolute({ label: card.title, href: card.href })}: ${card.summary}`)),
    ...(page.relatedDocuments.length === 0
      ? []
      : [
          `## ${kitLabels.relatedDocuments}`,
          list(
            page.relatedDocuments.map((card) => `${absolute({ label: card.title, href: card.href })}: ${card.summary}`),
          ),
        ]),
    `## ${kitLabels.sourcesTitle}`,
    ...page.sources.flatMap((group) => [`### ${group.title}`, list(group.sources.map(absolute))]),
    toMarkdown(hub.disclaimer),
    ...closing,
  ]);
}

function hubMarkdown(): string {
  const page = hubPage();
  const { decision, timeline, guides, documents, changes } = page;
  const cards = (items: { title: string; summary: string; href: string }[]) =>
    list(items.map((card) => `${absolute({ label: card.title, href: card.href })}: ${card.summary}`));
  return doc([
    `# ${page.hero.title}`,
    `${page.news.tag}: ${page.news.text}.`,
    page.hero.lead,
    `## ${decision.title}`,
    decision.lead,
    ...decision.columns.flatMap((column) => [
      `### ${column.title}`,
      `${toMarkdown(column.ruleText)} (${column.cites.map(absolute).join(', ')})`,
      `${column.examplesLabel}: ${column.examples.join(' ')}`,
      list(column.points),
      `${column.count.number} ${column.count.text}${column.tag === null ? '' : ` "${column.tag}"`}`,
    ]),
    ...decision.notes.map(
      (note) =>
        `${note.label} ${toMarkdown(note.text)} (${note.cites.map(absolute).join(', ')})${note.link === null ? '' : ` ${absolute(note.link)}`}`,
    ),
    absolute(decision.link),
    `## ${timeline.title}`,
    timeline.lead,
    ...timeline.steps.flatMap((step) => [
      `### ${step.when}: ${step.title}`,
      step.facts.map(factMarkdown).join('\n'),
      step.links.map(absolute).join(' · '),
    ]),
    `${timeline.bridge.text} ${absolute(timeline.bridge.link)}`,
    `## ${guides.title}`,
    ...guides.groups.flatMap((group) => [`### ${group.number} ${group.title}`, cards(group.cards)]),
    `## ${documents.title}`,
    documents.lead,
    cards(documents.cards),
    `## ${changes.title}`,
    changes.lead,
    ...changes.groups.flatMap((group) => [
      `### ${group.title}`,
      group.changes
        .map(
          (change) =>
            `${factMarkdown(change.fact)}\n  ${change.origins.map((origin) => absolute({ label: `${origin.guide}: ${origin.section}`, href: origin.href })).join(' · ')}`,
        )
        .join('\n'),
    ]),
    `### ${changes.pendingTitle}`,
    changes.pending.facts.map(factMarkdown).join('\n'),
    toMarkdown(hub.disclaimer),
  ]);
}

// A document as Markdown: the blank document's text, a field as a line to fill in, a choice with its two
// boxes.
function printedMarkdown(blocks: readonly PrintBlock[]): string[] {
  const { agree, disagree, place_date: at, date } = documentLabels.printed;
  return blocks.flatMap((block): string[] => {
    switch (block.type) {
      case 'heading':
        return [`**${block.text}**`];
      case 'paragraph':
      case 'note':
        return paragraphs(block.text);
      case 'values':
        return [list(block.lines.map((line) => `${line.label}: ${line.value}`))];
      case 'fields':
        return [list(block.fields.map((field) => (field.label === '' ? '…' : `${field.label}: …`)))];
      case 'options':
        return [list(block.items)];
      case 'box':
        return [...(block.title === null ? [] : [`### ${block.title}`]), ...printedMarkdown(block.blocks)];
      case 'item':
        return [
          `### ${block.number}. ${block.title}`,
          ...paragraphs(block.text),
          ...(block.kind === 'choice' ? [`☐ ${agree} ☐ ${disagree}`] : []),
          ...(block.fields.length > 0 ? [list(block.fields.map((field) => `${field.label}: …`))] : []),
        ];
      case 'signature':
        return [`${at} … ${date} …`, list(block.signers.map((signer) => `${signer}: …`))];
    }
  });
}

function documentMarkdown(slug: DocumentSlug): string {
  const page = documentPage(slug);
  const printed = blankDocument(templateBySlug[slug]);
  return doc([
    `# ${page.title}`,
    page.lead,
    page.verified,
    `${absolute({ label: page.blank.label, href: page.blank.href })}`,
    `## ${page.previewTitle}: ${printed.title}`,
    ...(printed.subtitle === null ? [] : [printed.subtitle]),
    ...printedMarkdown(printed.blocks),
    `## ${page.explain.title}`,
    ...legendMarkdown,
    ...page.explain.sections.flatMap((section) => [
      `### ${section.title}`,
      absolute(section.origin),
      section.facts.map(factMarkdown).join('\n'),
    ]),
    page.explain.facts.map(factMarkdown).join('\n'),
    ...(page.items === null
      ? []
      : [
          `## ${page.items.title}`,
          page.items.lead,
          ...page.items.list.flatMap((item) => [
            `### ${item.title}${item.defaultOn === null ? '' : ` (${item.defaultOn})`}`,
            factMarkdown(item.why),
          ]),
        ]),
    ...(page.relatedGuides.length === 0
      ? []
      : [
          `## ${kitLabels.relatedGuides}`,
          list(
            page.relatedGuides.map((card) => `${absolute({ label: card.title, href: card.href })}: ${card.summary}`),
          ),
        ]),
    `## ${kitLabels.relatedDocuments}`,
    list(page.relatedDocuments.map((card) => `${absolute({ label: card.title, href: card.href })}: ${card.summary}`)),
    `## ${kitLabels.sourcesTitle}`,
    ...page.sources.flatMap((group) => [`### ${group.title}`, list(group.sources.map(absolute))]),
    toMarkdown(hub.disclaimer),
    `## ${page.inCampie.title}`,
    page.inCampie.text,
    link(page.inCampie.cta),
  ]);
}

function documentsMarkdown(): string {
  const page = documentsIndexPage();
  return doc([
    `# ${page.hero.title}`,
    page.hero.lead,
    list(page.cards.map((card) => `${absolute({ label: card.title, href: card.href })}: ${card.summary}`)),
    link(page.guides),
  ]);
}

const builders = {
  home: homeMarkdown,
  features: featuresMarkdown,
  security: securityMarkdown,
  contact: contactMarkdown,
  weby: webyMarkdown,
} satisfies Record<SitePageKey, () => string>;

export function pageMarkdown(key: IndexedPageKey): string {
  if (isGuideKey(key)) {
    return guideMarkdown(guideSlug(key));
  }
  if (isDocumentKey(key)) {
    return documentMarkdown(documentSlug(key));
  }
  if (key === 'documents') {
    return documentsMarkdown();
  }
  return key === 'kit' ? hubMarkdown() : builders[key]();
}

export function markdownUrl(key: IndexedPageKey): string {
  return `${site.url}/${pages[key].slug}.md`;
}

// A page's name in llms.txt: its breadcrumb, the home page has none.
const llmsName = (key: IndexedPageKey) => pages[key].breadcrumb ?? 'Úvod';

// llms.txt as llmstxt.org describes it: a title, a summary, a paragraph, then the pages as Markdown.
// "Optional" is the format's own section name for links a reader may skip: here the ones off this site.
export function llmsTxt(): string {
  return doc([
    `# ${site.name}`,
    `> ${pages.home.description}`,
    'Campie je hostovaný přihláškový systém pro české letní tábory: vlastní přihláška, turnusy a ceník, platby QR kódem nebo kartou, souhlasy podepsané online a dokumenty. Je open source pod licencí AGPL-3.0.',
    '## Stránky',
    indexedPageKeys.map((key) => `- [${llmsName(key)}](${markdownUrl(key)}): ${pages[key].description}`).join('\n'),
    '## Optional',
    [...footer.legal, footer.origin].map((item) => `- ${link(item)}`).join('\n'),
  ]);
}

// Every page's Markdown in one file.
export function llmsFullTxt(): string {
  return indexedPageKeys.map(pageMarkdown).join('\n---\n\n');
}
