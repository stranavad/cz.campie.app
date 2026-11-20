import { documentList } from '../../content/kit/document-list.ts';
import { documentLabels, documents, documentsIndex, templateBySlug } from '../../content/kit/documents/index.ts';
import { guideBySlug, guides } from '../../content/kit/guides/index.ts';
import { hub, kitLabels } from '../../content/kit/hub.ts';
import { guideIcons } from '../../content/kit/icons.ts';
import type { DocumentSlug, Fact, GuideSlug, IsoDate, TimelineStep } from '../../content/kit/types.ts';
import { pages } from '../../content/seo.ts';
import { downloadEvent } from '../analytics.ts';
import { toHtml } from '../inline.ts';
import { fill, type DeadlineLabels } from './deadlines.ts';
import { blankDocument } from './document.ts';
import {
  citedSources,
  citeLink,
  czechCount,
  czechDate,
  factView,
  verification,
  type CiteLink,
  type FactView,
} from './facts.ts';
import {
  documentCard,
  documentHref,
  documentPdfHref,
  guideCard,
  guideCardView,
  guideEntries,
  guideHref,
  templateCardView,
} from './links.ts';
import { blankPdf } from './pdf-node.ts';
import { previewHtml } from './preview.ts';
import { sheetCss } from './sheet.ts';

// What the kit's two templates render, computed here so the .astro files only map over it.

export function guideStaticPaths() {
  return guides.map((guide) => ({ params: { slug: guide.slug }, props: { slug: guide.slug } }));
}

// A guide's page: the verification line, the counts, the contents, the sections as claim rows, the
// templates and guides it links, its sources, and the previous and next guide in the hub's order.
export function guidePage(slug: GuideSlug) {
  const guide = guideBySlug[slug];
  const sections = guide.sections.map((section, index) => {
    const facts = section.facts.map(factView);
    const small = facts.filter((fact) => fact.smallToo !== null).length;
    return {
      id: section.id,
      number: String(index + 1).padStart(2, '0'),
      title: section.title,
      intro: section.intro === undefined ? null : toHtml(section.intro),
      facts,
      count: czechCount(facts.length, kitLabels.rulesPlural),
      // True when a row of the section survives the small-event filter.
      hasSmall: small > 0,
    };
  });
  const total = sections.reduce((sum, section) => sum + section.facts.length, 0);
  const small = sections.reduce(
    (sum, section) => sum + section.facts.filter((fact) => fact.smallToo !== null).length,
    0,
  );
  const position = guideEntries.findIndex((entry) => entry.slug === slug);
  const neighbour = (index: number, side: 'previous' | 'next') => {
    const entry = guideEntries[index];
    const label = side === 'previous' ? kitLabels.previousGuide : kitLabels.nextGuide;
    return entry === undefined
      ? []
      : [{ side, label, title: guideBySlug[entry.slug].nav, href: guideHref(entry.slug) }];
  };
  return {
    title: guide.title,
    lead: toHtml(guide.lead),
    verified: `${kitLabels.verified} ${czechDate(guide.verified)} · ${kitLabels.legalState}`,
    verification: verification(guide.verified),
    counts: {
      total: czechCount(total, kitLabels.rulesPlural),
      small: small > 0 ? `${small} ${kitLabels.smallCount}` : null,
    },
    // The filter is offered when it leaves some rows and hides some.
    filter: small > 0 && small < total ? { label: kitLabels.smallFilter, hint: kitLabels.smallFilterHint } : null,
    contentsTitle: kitLabels.contents,
    contents: sections.map((section) => ({
      number: section.number,
      label: section.title,
      href: `#${section.id}`,
      count: section.count,
      hasSmall: section.hasSmall,
    })),
    sections,
    relatedGuides: guide.related.guides.map(guideCardView),
    relatedDocuments: guide.related.documents.map(templateCardView),
    sources: citedSources(guide.sections.flatMap((section) => section.facts)),
    disclaimer: toHtml(hub.disclaimer),
    pager: {
      label: kitLabels.guidesInOrder,
      links: [...neighbour(position - 1, 'previous'), ...neighbour(position + 1, 'next')],
    },
  };
}

export interface ChangeOrigin {
  guide: string;
  section: string;
  href: string;
}

export interface Change {
  fact: FactView;
  origins: ChangeOrigin[];
}

export interface ChangeGroup {
  date: IsoDate;
  title: string;
  changes: Change[];
}

// Every Fact that names a change in force from hub.changes.from on, newest first, grouped by the day it
// took effect. It is shown in the change's own words, with the Fact's basis and citations. A change
// named the same way in two guides is listed once, with a link to each place it comes from.
export function kitChanges(): ChangeGroup[] {
  const found = new Map<string, { fact: Fact & { since: IsoDate }; origins: ChangeOrigin[] }>();
  for (const guide of guides) {
    for (const section of guide.sections) {
      for (const fact of section.facts) {
        if (fact.change === undefined || fact.since === undefined || fact.since < hub.changes.from) {
          continue;
        }
        const origin = { guide: guide.nav, section: section.title, href: `${guideHref(guide.slug)}#${section.id}` };
        const seen = found.get(fact.change);
        if (seen === undefined) {
          const { quote: _quote, ...rest } = fact;
          found.set(fact.change, { fact: { ...rest, text: fact.change, since: fact.since }, origins: [origin] });
        } else {
          seen.origins.push(origin);
        }
      }
    }
  }
  const headings: Partial<Record<IsoDate, string>> = hub.changes.headings;
  const entries = [...found.values()];
  const dates = [...new Set(entries.map((entry) => entry.fact.since))].toSorted().toReversed();
  return dates.map((date) => ({
    date,
    title: headings[date] ?? `${kitLabels.since} ${czechDate(date)}`,
    changes: entries
      .filter((entry) => entry.fact.since === date)
      .map((entry) => ({ fact: factView(entry.fact), origins: entry.origins })),
  }));
}

export type HubPage = ReturnType<typeof hubPage>;

const links = (cards: { title: string; href: string }[]): CiteLink[] =>
  cards.map((card) => ({ label: card.title, href: card.href }));

// Every rule of the guides, and those that also bind a smaller event: the counts of the hub's step 1.
function ruleCounts() {
  const facts = guides.flatMap((guide) => guide.sections.flatMap((section) => section.facts));
  return { total: facts.length, small: facts.filter((fact) => fact.smallToo === true).length };
}

// "187" and "pravidel ve všech 11 průvodcích ...": the number set large, the rest after it.
function ruleCount(count: number, rest: string, values: Record<string, number>) {
  const [number = '', ...word] = czechCount(count, kitLabels.rulesPlural).split(' ');
  return { number, text: `${word.join(' ')} ${fill(rest, values)}` };
}

const guideRules = (slug: GuideSlug) =>
  czechCount(
    guideBySlug[slug].sections.reduce((sum, section) => sum + section.facts.length, 0),
    kitLabels.rulesPlural,
  );

// /pruvodce: the hero with the year's news chip and the three entry cards, step 1 (which kind of event),
// step 2 (the timeline with the deadline calculator), the guides in their groups, the templates and what
// changed.
export function hubPage() {
  const { decision, timeline, changes, entries } = hub;
  const counts = ruleCounts();
  const businessGuide = guideBySlug[decision.notes.business.guide];
  const changeGroups = kitChanges();
  const [latest, ...older] = changeGroups;
  const changeCount = (count: number) => czechCount(count, changes.plural);
  return {
    news: { tag: kitLabels.newTag, text: hub.news, href: '#novinky' },
    hero: hub.hero,
    verification: verification(pages.kit.lastModified),
    entries: [
      { ...entries.kind, icon: guideIcons.sign, href: '#akce' },
      { ...entries.when, icon: guideIcons.calendar, href: '#kdy' },
      {
        title: entries.documents.title,
        text: `${czechCount(documentList.length, kitLabels.templatesPlural)} ${entries.documents.text}`,
        icon: guideIcons.sheet,
        href: '#vzory',
      },
    ],
    decision: {
      eyebrow: decision.eyebrow,
      title: decision.title,
      lead: decision.lead,
      pointsTitle: decision.pointsTitle,
      columns: decision.columns.map((column, index) => ({
        // The first column, the event with more duties, is drawn with the stronger frame.
        strong: index === 0,
        label: column.label,
        title: column.title,
        // As written, for the Markdown twin.
        ruleText: `${column.rule.first} ${column.rule.join} ${column.rule.second}`,
        rule: {
          first: toHtml(column.rule.first),
          join: column.rule.join,
          second: toHtml(column.rule.second),
        },
        cites: column.cites.map(citeLink),
        examplesLabel: column.examplesLabel,
        examples: column.examples,
        points: column.points,
        count:
          index === 0
            ? ruleCount(counts.total, column.count, { guides: guideEntries.length })
            : ruleCount(counts.small, column.count, { total: counts.total }),
        // The smaller event's count ends with the tag its rules carry.
        tag: index === 0 ? null : kitLabels.smallToo,
      })),
      notes: [
        {
          warn: false,
          label: decision.notes.boundary.label,
          text: decision.notes.boundary.text,
          html: toHtml(decision.notes.boundary.text),
          cites: decision.notes.boundary.cites.map(citeLink),
          link: null,
        },
        {
          warn: true,
          label: decision.notes.business.label,
          text: decision.notes.business.text,
          html: toHtml(decision.notes.business.text),
          cites: decision.notes.business.cites.map(citeLink),
          link: {
            label: `${decision.notes.business.guidePrefix} ${businessGuide.nav}`,
            href: guideHref(businessGuide.slug),
          },
        },
      ],
      link: {
        label: `${decision.linkPrefix} ${guideBySlug[decision.link].nav} · ${guideRules(decision.link)}`,
        href: guideHref(decision.link),
      },
    },
    timeline: {
      eyebrow: timeline.eyebrow,
      title: timeline.title,
      lead: timeline.lead,
      calculator: {
        label: timeline.calculator.label,
        empty: timeline.calculator.empty,
        // What the script needs, as a data attribute: it imports no content.
        labels: JSON.stringify(timeline.calculator satisfies DeadlineLabels),
      },
      steps: timeline.steps.map((step: TimelineStep) => ({
        when: step.when,
        title: step.title,
        offset: step.offset === undefined ? null : JSON.stringify(step.offset),
        summary: step.summary ?? null,
        // The camp's first day is the marked step.
        marked: step.offset !== undefined && 'days' in step.offset && step.offset.days === 0,
        facts: step.facts.map(factView),
        links: [...links(step.links.guides.map(guideCard)), ...links(step.links.documents.map(documentCard))],
      })),
      bridge: { text: timeline.bridge.text, link: timeline.bridge.link },
    },
    guides: {
      eyebrow: `${hub.guides.eyebrow} · ${guideEntries.length}`,
      title: hub.guides.title,
      groups: hub.guides.groups.map((group) => ({
        number: group.number,
        title: group.title,
        // A group of four is a 2x2 grid, the others three in a row.
        columns: group.guides.length === 4 ? 2 : 3,
        cards: group.guides.map((entry) => guideCardView(entry.slug)),
      })),
    },
    documents: {
      eyebrow: hub.documents.eyebrow,
      title: hub.documents.title,
      lead: hub.documents.lead,
      all: hub.documents.all,
      cards: documentList.map((item) => templateCardView(item.slug)),
    },
    changes: {
      eyebrow: changes.eyebrow,
      title: changes.title,
      lead: changes.lead,
      // The newest date's changes, the first as the large card; every older date folded.
      latest:
        latest === undefined
          ? null
          : {
              title: `${latest.title} · ${changeCount(latest.changes.length)}`,
              headlineLabel: changes.headline,
              changes: latest.changes,
            },
      older: older.map((group) => ({
        title: `${group.title} · ${changeCount(group.changes.length)}`,
        show: `${changes.show} ${changeCount(group.changes.length)}`,
        changes: group.changes,
      })),
      pending: {
        title: `${changes.pending.title} · ${changes.pending.note}`,
        facts: changes.pending.facts.map(factView),
      },
      // For the Markdown twin.
      groups: changeGroups,
      pendingTitle: changes.pending.title,
    },
    disclaimer: toHtml(hub.disclaimer),
  };
}

export function documentStaticPaths() {
  return documents.map((item) => ({ params: { slug: item.slug }, props: { slug: item.slug } }));
}

// /vzory: the templates as large cards with both ways to get them, then the guides they belong to.
export function documentsIndexPage() {
  const verified = documents.map((item) => item.verified).toSorted()[0] ?? kitLabels.newFrom;
  const guideSlugs = new Set(documents.flatMap((item) => item.related.guides));
  return {
    hero: documentsIndex.hero,
    verification: verification(verified),
    cards: documents.map((item) => ({
      ...templateCardView(item.slug),
      blank: {
        label: documentsIndex.downloadBlank,
        href: documentPdfHref(item.slug),
        download: `${item.slug}.pdf`,
        event: downloadEvent({ template: item.slug, variant: 'blank' }),
      },
      // A form prints as the regulation words it; only a template is adapted.
      customise:
        item.kind === 'form'
          ? { label: documentsIndex.open, href: documentHref(item.slug) }
          : { label: documentLabels.customise, href: `${documentHref(item.slug)}#${CONFIGURATOR_ID}` },
    })),
    guidesSection: {
      title: documentsIndex.guidesTitle,
      lead: documentsIndex.guidesLead,
      cards: guideEntries.filter((entry) => guideSlugs.has(entry.slug)).map((entry) => guideCardView(entry.slug)),
    },
    guides: documentsIndex.guides,
  };
}

// The id of the configurator's place on a template's page, which the hero's second action jumps to.
export const CONFIGURATOR_ID = 'upravit';

// The Fact a template's hero answers with (`explain.answer`).
function answerFact(slug: DocumentSlug): Fact {
  const { answer, facts } = templateBySlug[slug].explain;
  const from =
    answer.section === undefined
      ? facts
      : guideBySlug[answer.section.guide].sections.find((section) => section.id === answer.section?.id)?.facts;
  const fact = from?.[answer.index];
  if (fact === undefined) {
    throw new Error(`The answer of ${slug} names no Fact`);
  }
  return fact;
}

// "1 strana", "2 strany" of a document.
const pagesCount = (count: number) => czechCount(count, documentLabels.pagesPlural);

// A template's page, top to bottom as the design draws it: the verification line, the answer and the
// two ways to the document; the configurator (or, for the form, why it cannot be changed) beside the
// preview; what the law says, why each item is offered, the disclaimer, and beside them the related
// guides and templates and the sources.
export function documentPage(slug: DocumentSlug) {
  const template = templateBySlug[slug];
  const isForm = template.kind === 'form';
  const sections = template.explain.sections.map((ref) => {
    const guide = guideBySlug[ref.guide];
    const section = guide.sections.find((item) => item.id === ref.section);
    if (section === undefined) {
      throw new Error(`The guide ${ref.guide} has no section ${ref.section}`);
    }
    return {
      id: `${ref.guide}-${section.id}`,
      title: section.title,
      origin: { label: guide.nav, href: `${guideHref(guide.slug)}#${section.id}` },
      intro: section.intro === undefined ? null : toHtml(section.intro),
      facts: section.facts.map(factView),
      raw: section.facts,
    };
  });
  const facts: Fact[] = [
    ...sections.flatMap((section) => section.raw),
    ...template.explain.facts,
    ...template.items.map((item) => item.why),
  ];
  return {
    up: { label: documentsIndex.nav, href: pages.documents.path },
    title: template.pageTitle,
    lead: template.lead,
    verified: `${kitLabels.verified} ${czechDate(template.verified)} · ${kitLabels.legalState}`,
    verification: verification(template.verified),
    answer: factView(answerFact(slug)),
    blank: {
      label: documentLabels.downloadBlank,
      href: documentPdfHref(slug),
      download: `${slug}.pdf`,
      event: downloadEvent({ template: slug, variant: 'blank' }),
    },
    paths: {
      blank: isForm ? documentLabels.paths.form : documentLabels.paths.blank,
      custom: isForm ? null : documentLabels.paths.custom,
    },
    customise: isForm ? null : { label: documentLabels.customise, href: `#${CONFIGURATOR_ID}` },
    configurator: documentLabels.configurator,
    configuratorId: CONFIGURATOR_ID,
    previewTitle: documentLabels.preview,
    previewLabel: documentLabels.previewLabel,
    formWhy: isForm ? documentLabels.formWhy : null,
    explain: {
      eyebrow: documentLabels.lawEyebrow,
      title: template.explain.title,
      sections: sections.map(({ raw: _raw, ...section }) => section),
      facts: template.explain.facts.map(factView),
    },
    items:
      template.items.length === 0
        ? null
        : {
            eyebrow: documentLabels.itemsEyebrow,
            title: documentLabels.itemsWhy,
            lead: documentLabels.itemsWhyLead,
            list: template.items.map((item) => ({
              id: item.id,
              title: item.title,
              defaultOn: item.defaultOn ? documentLabels.defaultOn : documentLabels.defaultOff,
              why: factView(item.why),
            })),
          },
    relatedGuides: template.related.guides.map(guideCard),
    relatedDocuments: template.related.documents.map(documentCard),
    // The column beside the rules: small cards of the guides and templates, then the sources.
    related: {
      label: documentLabels.related,
      guides: {
        title: documentLabels.relatedGuides,
        cards: template.related.guides.map((guide) => {
          const card = guideCardView(guide);
          return { title: card.title, href: card.href, meta: `${card.summary.replace(/\.$/, '')} · ${card.count}` };
        }),
      },
      documents: {
        title: documentLabels.relatedDocuments,
        cards: template.related.documents.map((document) => {
          const card = templateCardView(document);
          const items = templateBySlug[document].items.length;
          return {
            title: card.title,
            href: card.href,
            meta: items === 0 ? card.tag : `${card.tag} · ${czechCount(items, documentLabels.itemsPlural)}`,
          };
        }),
      },
      sourcesTitle: documentLabels.sources,
    },
    sources: citedSources(facts),
    disclaimer: toHtml(hub.disclaimer),
    inCampie: {
      title: documentLabels.afterDownload.title,
      text: template.inCampie,
      cta: documentLabels.afterDownload.cta,
    },
  };
}

// A template's static preview: the blank document's pages as its PDF lays them out, so the page shows
// the PDF's page breaks before any script runs, the stylesheet the pages are drawn with, and what the
// blank PDF is ("PDF · 1 strana · 42 kB", "1 strana A4").
export async function documentPreview(slug: DocumentSlug) {
  const template = templateBySlug[slug];
  const { layout, output } = await blankPdf(template);
  const pages = pagesCount(layout.pages);
  return {
    html: previewHtml(blankDocument(template), layout),
    css: sheetCss(),
    pdfMeta: [documentLabels.pdf, pages, `${Math.round(output.length / 1024)} ${documentLabels.kilobytes}`].join(' · '),
    pages: `${pages} ${documentLabels.a4}`,
  };
}
