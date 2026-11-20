import { mkdir, writeFile } from 'node:fs/promises';
import sitemap, { type SitemapItem } from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import { documents } from './src/content/kit/documents/index.ts';
import { pages } from './src/content/seo.ts';
import { site } from './src/content/site.ts';
import { buildHeaders, buildSecurityTxt } from './src/lib/headers.ts';
import { pageUrl } from './src/lib/href.ts';
import { documentPdfHref } from './src/lib/kit/links.ts';
import { sitemapSection, type SitemapSection } from './src/lib/nav.ts';
import { siteEnv } from './src/lib/site-env.ts';

// Only the indexed pages and the kit's blank PDFs go into the sitemap, each with its last change, split by
// part behind one index: sitemap-produkt-0.xml, sitemap-pruvodce-0.xml, sitemap-vzory-0.xml (with the
// PDFs) and sitemap-weby-0.xml.
const pdfs = documents.map((item) => [pageUrl(documentPdfHref(item.slug)), item.verified] as const);
const lastModified = new Map([
  ...Object.values(pages).map((page) => [pageUrl(page.path), page.lastModified] as const),
  ...pdfs,
]);

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
    // One small stylesheet per page: inlined, so the first paint needs no second request.
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      customPages: pdfs.map(([url]) => url),
      filter: (url) => lastModified.has(url),
      serialize: (item) => ({ ...item, lastmod: lastModified.get(item.url) }),
      chunks: Object.fromEntries(
        (['produkt', 'pruvodce', 'vzory', 'weby'] satisfies SitemapSection[]).map((section) => [
          section,
          (item: SitemapItem) => (sitemapSection(item.url) === section ? item : undefined),
        ]),
      ),
    }),
    {
      // Cloudflare's _headers and security.txt, written next to the pages.
      name: 'campie-web-headers',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await writeFile(new URL('_headers', dir), buildHeaders(siteEnv));
          await mkdir(new URL('.well-known/', dir), { recursive: true });
          await writeFile(new URL('.well-known/security.txt', dir), buildSecurityTxt(new Date()));
        },
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    // The site's modules read SITE_ENV once (src/lib/site-env.ts); the kit's configurator imports some of
    // them in the browser, where there is no process.
    define: { 'process.env.SITE_ENV': JSON.stringify(process.env.SITE_ENV ?? '') },
    // Scripts stay files: the Content-Security-Policy allows no inline script.
    build: { assetsInlineLimit: 0 },
  },
});
