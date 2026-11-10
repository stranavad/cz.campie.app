import { mkdir, writeFile } from 'node:fs/promises';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import { pages } from './src/content/seo.ts';
import { site } from './src/content/site.ts';
import { buildHeaders, buildSecurityTxt } from './src/lib/headers.ts';
import { pageUrl } from './src/lib/href.ts';
import { siteEnv } from './src/lib/site-env.ts';

// Only the indexed pages go into the sitemap, each with its last change.
const lastModified = new Map(Object.values(pages).map((page) => [pageUrl(page.path), page.lastModified]));

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
      filter: (url) => lastModified.has(url),
      serialize: (item) => ({ ...item, lastmod: lastModified.get(item.url) }),
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
    // Scripts stay files: the Content-Security-Policy allows no inline script.
    build: { assetsInlineLimit: 0 },
  },
});
