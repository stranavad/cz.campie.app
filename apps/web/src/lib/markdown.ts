import { contact } from '../content/contact.ts';
import { features } from '../content/features.ts';
import { home } from '../content/home.ts';
import { security } from '../content/security.ts';
import { indexedPageKeys, pages, type IndexedPageKey } from '../content/seo.ts';
import { ctaBand, footer, site } from '../content/site.ts';
import type { Cta } from '../content/types.ts';
import { absoluteHref } from './href.ts';
import { toMarkdown } from './inline.ts';

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
    testimonials.lead,
    ...testimonials.items.map((item) => `> „${item.quote}“\n>\n> ${item.name}, ${item.role}`),
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

const builders = {
  home: homeMarkdown,
  features: featuresMarkdown,
  security: securityMarkdown,
  contact: contactMarkdown,
} satisfies Record<IndexedPageKey, () => string>;

export function pageMarkdown(key: IndexedPageKey): string {
  return builders[key]();
}

export function markdownUrl(key: IndexedPageKey): string {
  return `${site.url}/${pages[key].slug}.md`;
}

const llmsNames = {
  home: 'Úvod',
  features: pages.features.breadcrumb,
  security: pages.security.breadcrumb,
  contact: pages.contact.breadcrumb,
} satisfies Record<IndexedPageKey, string>;

// llms.txt as llmstxt.org describes it: a title, a summary, a paragraph, then the pages as Markdown.
// "Optional" is the format's own section name for links a reader may skip: here the ones off this site.
export function llmsTxt(): string {
  return doc([
    `# ${site.name}`,
    `> ${pages.home.description}`,
    'Campie je hostovaný přihláškový systém pro české letní tábory: vlastní přihláška, turnusy a ceník, platby QR kódem nebo kartou, souhlasy podepsané online a dokumenty. Je open source pod licencí AGPL-3.0.',
    '## Stránky',
    indexedPageKeys.map((key) => `- [${llmsNames[key]}](${markdownUrl(key)}): ${pages[key].description}`).join('\n'),
    '## Optional',
    footer.links
      .filter((item) => !item.href.startsWith('/'))
      .map((item) => `- ${link(item)}`)
      .join('\n'),
  ]);
}

// Every page's Markdown in one file.
export function llmsFullTxt(): string {
  return indexedPageKeys.map(pageMarkdown).join('\n---\n\n');
}
