import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { documents } from '../src/content/kit/documents/index.ts';
import { guides } from '../src/content/kit/guides/index.ts';
import { hub } from '../src/content/kit/hub.ts';
import { citeLink } from '../src/lib/kit/facts.ts';

// Reads the default (local) build in dist/, which turbo builds before the tests.
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const read = (file: string) => readFileSync(join(dist, file), 'utf8');

// The site's pages, then the starter kit: its hub, a page per guide, the list of templates and a page
// per template.
const indexed = [
  ['index.html', 'https://campie.cz/'],
  ['co-umi.html', 'https://campie.cz/co-umi'],
  ['bezpecnost.html', 'https://campie.cz/bezpecnost'],
  ['kontakt.html', 'https://campie.cz/kontakt'],
  ['weby-pro-tabory.html', 'https://campie.cz/weby-pro-tabory'],
  ['pruvodce.html', 'https://campie.cz/pruvodce'],
  ...guides.map((guide) => [`pruvodce/${guide.slug}.html`, `https://campie.cz/pruvodce/${guide.slug}`] as const),
  ['vzory.html', 'https://campie.cz/vzory'],
  ...documents.map((item) => [`vzory/${item.slug}.html`, `https://campie.cz/vzory/${item.slug}`] as const),
] as const;
const pdfs = documents.map((item) => [`vzory/${item.slug}.pdf`, `https://campie.cz/vzory/${item.slug}.pdf`] as const);
const twins = indexed.map(([file]) => file.replace(/\.html$/, '.md'));
const utility = [
  '404.html',
  'kontakt/odeslano.html',
  'kontakt/chyba.html',
  'weby-pro-tabory/odeslano.html',
  'weby-pro-tabory/chyba.html',
];

const head = (html: string, pattern: RegExp) => pattern.exec(html)?.[1];
const title = (html: string) => head(html, /<title>([^<]*)<\/title>/);
const description = (html: string) => head(html, /<meta name="description" content="([^"]*)"/);
const scripts = (html: string) => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];

function textFiles(dir = dist): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '_astro' ? [] : textFiles(path);
    }
    return /\.(html|md|txt|xml)$/.test(entry.name) ? [path] : [];
  });
}

const pageFiles = [...indexed.map(([file]) => file), ...utility];

describe('the built site', () => {
  it('gives every page one h1, its own title and description, and production canonicals', () => {
    const pages = pageFiles.map(read);
    expect(pages.map((html) => html.match(/<h1\b/g)?.length)).toEqual(pageFiles.map(() => 1));
    expect(indexed.map(([file]) => head(read(file), /<link rel="canonical" href="([^"]*)"/))).toEqual(
      indexed.map(([, canonical]) => canonical),
    );
    expect(new Set(pages.map(title)).size).toBe(pages.length);
    expect(new Set(pages.map(description)).size).toBe(pages.length);
  });

  it('keeps a build without SITE_ENV out of search engines', () => {
    expect(
      pageFiles.filter((file) => !read(file).includes('<meta name="robots" content="noindex, nofollow">')),
    ).toEqual([]);
    expect(read('robots.txt')).toContain('Disallow: /');
    expect(read('_headers')).toContain('X-Robots-Tag: noindex, nofollow');
  });

  it('runs no inline script: only data blocks, speculation rules and files', () => {
    const all = textFiles()
      .filter((path) => path.endsWith('.html'))
      .flatMap((file) =>
        scripts(readFileSync(file, 'utf8')).map(([, attributes = '', body = '']) => ({ attributes, body })),
      );
    const executable = all.filter(
      ({ attributes, body }) =>
        !/type="(application\/ld\+json|speculationrules)"/.test(attributes) &&
        !(/\bsrc="/.test(attributes) && body === ''),
    );
    expect(executable).toEqual([]);
    const jsonLd = all.filter(({ attributes }) => attributes.includes('application/ld+json'));
    expect(jsonLd.length).toBeGreaterThan(0);
    expect(() => jsonLd.map(({ body }) => JSON.parse(body) as unknown)).not.toThrow();
  });

  it('publishes the sitemap, llms.txt and a Markdown twin of every page', () => {
    const links = [...read('llms.txt').matchAll(/\]\(https:\/\/campie\.cz\/([^)]+)\)/g)].map((match) => match[1] ?? '');
    expect(links).toEqual(twins);
    const images = twins.map((file) => `og/${file.replace(/\.md$/, '.png')}`);
    const files = ['sitemap-index.xml', 'llms.txt', 'llms-full.txt', '.well-known/security.txt', ...links, ...images];
    expect(files.filter((file) => !existsSync(join(dist, file)))).toEqual([]);
    // One sitemap per part behind the index; every page and blank PDF in exactly one of them.
    const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1] ?? '');
    const parts = locs(read('sitemap-index.xml')).map((url) => url.replace('https://campie.cz/', ''));
    expect(parts.filter((file) => !/^sitemap-(produkt|pruvodce|vzory|weby)-0\.xml$/.test(file))).toEqual([]);
    expect(parts).toEqual(
      expect.arrayContaining(['sitemap-produkt-0.xml', 'sitemap-pruvodce-0.xml', 'sitemap-vzory-0.xml']),
    );
    const sitemap = parts.flatMap((file) => locs(read(file)));
    expect(sitemap.toSorted()).toEqual([...indexed, ...pdfs].map(([, canonical]) => canonical).toSorted());
    expect(locs(read('sitemap-vzory-0.xml'))).toEqual(expect.arrayContaining(pdfs.map(([, canonical]) => canonical)));
  });

  it('puts the four header links and every guide and template in the footer on every page, and breadcrumbs from Campie, matching their data, on all but the home page', () => {
    const headerLinks = ['/co-umi', '/pruvodce', '/vzory', '/weby-pro-tabory'].map((path) => `href="${path}"`);
    const footerLinks = [
      ...guides.map((guide) => `href="/pruvodce/${guide.slug}"`),
      ...documents.map((item) => `href="/vzory/${item.slug}"`),
      'href="/pruvodce"',
      'href="/vzory"',
    ];
    const missing = pageFiles.flatMap((file) => {
      const html = read(file);
      const inHeader = /<header class="on-forest[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
      const inFooter = /<footer\b[\s\S]*?<\/footer>/.exec(html)?.[0] ?? '';
      return [
        ...headerLinks.filter((link) => !inHeader.includes(link)).map((link) => `${file} header: ${link}`),
        ...footerLinks.filter((link) => !inFooter.includes(link)).map((link) => `${file} footer: ${link}`),
      ];
    });
    expect(missing).toEqual([]);
    const text = (html: string) =>
      html
        .replace(/<[^>]+>/g, '')
        .replace('›', '')
        .trim();
    const trails = indexed
      .filter(([file]) => file !== 'index.html')
      .map(([file]) => {
        const html = read(file);
        const nav = /<nav\b[^>]*aria-label="Drobečková navigace"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
        const shown = [...nav.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => text(match[1] ?? ''));
        const data = JSON.parse(head(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/) ?? '{}') as {
          '@graph': { '@type': string; itemListElement?: { name: string }[] }[];
        };
        const list = data['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
        return {
          file,
          first: shown[0],
          matches: JSON.stringify(list?.itemListElement?.map((item) => item.name)) === JSON.stringify(shown),
        };
      });
    expect(trails.filter((trail) => trail.first !== 'Campie' || !trail.matches)).toEqual([]);
    expect(read('index.html')).not.toContain('Drobečková navigace');
  });

  it("renders the hub's timeline without script: every step and Fact with its sources, the date field hidden", () => {
    const html = read('pruvodce.html');
    const steps = [...html.matchAll(/<li\b[^>]*\bdata-step\b[^>]*>/g)];
    expect(steps).toHaveLength(hub.timeline.steps.length);
    const missing = hub.timeline.steps.flatMap((step) =>
      step.facts
        .flatMap((fact) => fact.cites.map((cite) => citeLink(cite).href))
        .filter((href) => !html.includes(href)),
    );
    expect(missing).toEqual([]);
    expect(html).toMatch(/<div\b[^>]*\bdata-deadline-form\b[^>]*\bhidden\b/);
  });

  it("indexes the kit for its search: lékárnička leads to the guide's section", () => {
    const index = JSON.parse(read('hledani.json')) as { title: string; href: string; texts: string[] }[];
    const hits = index.filter((entry) => entry.texts.some((item) => item.toLowerCase().includes('lékárnička')));
    expect(hits.map((entry) => entry.href)).toContain('/pruvodce/zdravotnik-a-lekarnicka#lekarnicka');
  });

  it('shows each blank template as the A4 pages of its PDF', () => {
    const pdfPages = pdfs.map(([file]) => /\/Count (\d+)/.exec(readFileSync(join(dist, file), 'latin1'))?.[1]);
    const previewPages = documents.map((item) => String(read(`vzory/${item.slug}.html`).match(/class="kp"/g)?.length));
    expect(previewPages).toEqual(pdfPages);
    expect(pdfPages).toEqual(documents.map(() => '1'));
  });

  it("builds a blank PDF of every template and loads the PDF library only on the configurator's demand", () => {
    expect(pdfs.map(([file]) => readFileSync(join(dist, file)).subarray(0, 5).toString())).toEqual(
      pdfs.map(() => '%PDF-'),
    );
    const pageScripts = documents.flatMap((item) =>
      scripts(read(`vzory/${item.slug}.html`)).map(
        ([, attributes = '']) => /src="\/_astro\/([^"]+)"/.exec(attributes)?.[1],
      ),
    );
    const loaded = pageScripts.filter((file) => file !== undefined).map((file) => read(`_astro/${file}`));
    expect(loaded.filter((code) => code.includes('pdfmake'))).toEqual([]);
    const chunks = readdirSync(join(dist, '_astro')).filter((file) => file.endsWith('.js'));
    expect(chunks.filter((file) => read(`_astro/${file}`).includes('pdfmake'))).toHaveLength(1);
  });

  it('contains no em-dash and no placeholder left from the design', () => {
    // The em-dash, a "doplnit" (to fill in), or a bracketed word that is not a Markdown link, like the
    // design's [Fotka] or [Jméno].
    const leftovers = new RegExp(`${String.fromCodePoint(0x2014)}|doplnit|\\[[^\\]\\n]+\\](?!\\()`, 'i');
    const offenders = textFiles().filter((file) =>
      leftovers.test(
        readFileSync(file, 'utf8')
          .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '')
          .replace(/<[^>]+>/g, ' '),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
