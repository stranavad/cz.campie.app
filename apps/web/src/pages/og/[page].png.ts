import type { APIRoute, GetStaticPaths } from 'astro';

import { indexedPageKeys, pages, type IndexedPageKey } from '../../content/seo.ts';
import { ogImage } from '../../lib/og.ts';

// /og/<slug>.png: each indexed page's Open Graph image.
export const getStaticPaths = (() =>
  indexedPageKeys.map((key) => ({ params: { page: pages[key].slug }, props: { key } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ key: IndexedPageKey }> = async ({ props }) => {
  const { eyebrow, title } = pages[props.key].og;
  return new Response(new Uint8Array(await ogImage(eyebrow, title)));
};
