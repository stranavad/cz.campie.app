import { home } from '../content/home.ts';
import { documentList } from '../content/kit/document-list.ts';
import { guideBySlug } from '../content/kit/guides/index.ts';
import { hub } from '../content/kit/hub.ts';
import type { DocumentSlug, GuideSlug } from '../content/kit/types.ts';
import { isDocumentKey, isGuideKey, pages, utilityPages, type IndexedPageKey, type PageKey } from '../content/seo.ts';
import { breadcrumbs, footer, header, type SitePart } from '../content/site.ts';
import type { Cta } from '../content/types.ts';
import { documentHref, guideHref } from './kit/links.ts';

// The site's navigation: which part a page belongs to, its breadcrumb trail, the header and the footer.
// Base.astro and its components only map over these.

const isUnder = (path: string, root: string) => path === root || path.startsWith(`${root}/`);

function indexed(key: PageKey): key is IndexedPageKey {
  return key in pages;
}

function pathOf(key: PageKey): string {
  return indexed(key) ? pages[key].path : utilityPages[key].path;
}

// A page's part, from its path: the kit lives under /pruvodce and /vzory, Weby on its own page, the rest
// is the product.
export function partOfPath(path: string): SitePart {
  const { guides, documents, weby } = header.items;
  if (isUnder(path, weby.href)) {
    return 'weby';
  }
  if (isUnder(path, guides.href) || isUnder(path, documents.href)) {
    return 'kit';
  }
  return 'product';
}

// The sitemap's files, one per part, the kit's split in guides and templates (with their PDFs).
export type SitemapSection = 'produkt' | 'pruvodce' | 'vzory' | 'weby';

// Takes an absolute URL or a path.
export function sitemapSection(url: string): SitemapSection {
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  const part = partOfPath(path);
  if (part === 'kit') {
    return isUnder(path, header.items.documents.href) ? 'vzory' : 'pruvodce';
  }
  return part === 'weby' ? 'weby' : 'produkt';
}

// Campie > page, Campie > Průvodce > guide, Campie > Vzory > template. Empty for the home page.
export function breadcrumbTrail(key: IndexedPageKey): Cta[] {
  if (key === 'home') {
    return [];
  }
  const parent = isGuideKey(key) ? [pages.kit] : isDocumentKey(key) ? [pages.documents] : [];
  return [pages.home, ...parent, pages[key]].map((page) => ({
    label: page.breadcrumb ?? breadcrumbs.home,
    href: page.path,
  }));
}

// What Base.astro wraps a page in.
export function pageFrame(key: PageKey) {
  const path = pathOf(key);
  const part = partOfPath(path);
  const trail = indexed(key) ? breadcrumbTrail(key) : [];
  return {
    header: headerNav(path, part),
    // The last crumb is the page itself, not a link.
    breadcrumbs: trail.length === 0 ? null : { links: trail.slice(0, -1), current: trail.at(-1)?.label ?? '' },
    kitAbout: part === 'kit',
  };
}

// The header: four links, the one the page lies under marked; the button on the right follows the part,
// and the kit's pages add the search.
function headerNav(path: string, part: SitePart) {
  return {
    items: Object.values(header.items).map((item) => ({ ...item, current: isUnder(path, item.href) })),
    action: header.action[part],
    // The quiet outlined button on the kit's pages, the orange one elsewhere.
    quiet: part === 'kit',
    search: part === 'kit',
  };
}

export type HeaderNav = ReturnType<typeof headerNav>;

function guideLink(slug: GuideSlug, label?: string): Cta {
  return { label: label ?? guideBySlug[slug].nav, href: guideHref(slug) };
}

// A content link to a guide or a template by its slug, or to a path; `note` is a tile's second line.
type ContentLink = { label: string; note?: string } & (
  { href: string } | { guide: GuideSlug } | { document: DocumentSlug }
);

function resolve(link: ContentLink): Cta & { note?: string } {
  const base = link.note === undefined ? { label: link.label } : { label: link.label, note: link.note };
  if ('guide' in link) {
    return { ...base, href: guideHref(link.guide) };
  }
  if ('document' in link) {
    return { ...base, href: documentHref(link.document) };
  }
  return { ...base, href: link.href };
}

// The footer: the product's and the camps' columns, and between them the kit's, which links every guide
// (in the hub's groups, under their short `menu` name) and every template.
export function footerNav() {
  const { kit } = footer;
  return {
    product: footer.columns.product,
    camps: footer.columns.camps,
    kit: {
      title: kit.title,
      lists: [
        {
          title: kit.guides.title,
          links: hub.guides.groups.flatMap((group) =>
            group.guides.map((guide) => guideLink(guide.slug, 'menu' in guide ? guide.menu : undefined)),
          ),
          all: kit.guides.all,
        },
        {
          title: kit.documents.title,
          links: documentList.map((item) => ({ label: item.nav, href: documentHref(item.slug) })),
          all: kit.documents.all,
        },
      ],
    },
  };
}

// The home page's band "Zdarma pro všechny pořadatele".
export function freeKitBand() {
  return { ...home.freeKit, tiles: home.freeKit.tiles.map(resolve) };
}
