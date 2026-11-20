import { documentList } from '../content/kit/document-list.ts';
import { guides } from '../content/kit/guides/index.ts';
import { header } from '../content/site.ts';
import { toPlain } from './inline.ts';
import { documentHref, guideHref } from './kit/links.ts';

// The kit's search index, one JSON file built from the content (src/pages/hledani.json.ts). The header's
// search fetches it on the field's first focus and filters it in the browser.

export interface SearchEntry {
  // What the result shows: the place, and the guide or kind it belongs to.
  title: string;
  context: string;
  href: string;
  // The texts searched: the title first, then each Fact, shown as the snippet when it matches.
  texts: string[];
}

export const SEARCH_INDEX_PATH = '/hledani.json';

export function searchIndex(): SearchEntry[] {
  const { kinds } = header.search;
  return [
    ...guides.flatMap((guide) => [
      {
        title: guide.nav,
        context: kinds.guide,
        href: guideHref(guide.slug),
        texts: [guide.title, guide.summary, guide.description],
      },
      ...guide.sections.map((section) => ({
        title: section.title,
        context: guide.nav,
        href: `${guideHref(guide.slug)}#${section.id}`,
        texts: [
          section.title,
          ...(section.intro === undefined ? [] : [toPlain(section.intro)]),
          ...section.facts.map((fact) => toPlain(fact.text)),
        ],
      })),
    ]),
    ...documentList.map((item) => ({
      title: item.nav,
      context: kinds.document,
      href: documentHref(item.slug),
      texts: [item.nav, item.summary],
    })),
  ];
}
