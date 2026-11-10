import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads the default (local) build in dist/, which turbo builds before the tests.
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const read = (file: string) => readFileSync(join(dist, file), 'utf8');

const indexed = [
  ['index.html', 'https://campie.cz/'],
  ['co-umi.html', 'https://campie.cz/co-umi'],
  ['bezpecnost.html', 'https://campie.cz/bezpecnost'],
  ['kontakt.html', 'https://campie.cz/kontakt'],
] as const;
const utility = ['404.html', 'kontakt/odeslano.html', 'kontakt/chyba.html'];

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
    expect(links).toEqual(['index.md', 'co-umi.md', 'bezpecnost.md', 'kontakt.md']);
    const files = ['sitemap-index.xml', 'llms.txt', 'llms-full.txt', '.well-known/security.txt', ...links];
    expect(files.filter((file) => !existsSync(join(dist, file)))).toEqual([]);
    expect(read('sitemap-0.xml')).not.toContain('/kontakt/');
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
