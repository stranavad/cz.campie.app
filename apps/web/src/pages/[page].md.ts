import type { APIRoute, GetStaticPaths } from 'astro';

import { indexedPageKeys, pages, type IndexedPageKey } from '../content/seo.ts';
import { pageMarkdown } from '../lib/markdown.ts';

// /index.md, /co-umi.md, ...: each indexed page as Markdown, linked from llms.txt.
export const getStaticPaths = (() =>
  indexedPageKeys.map((key) => ({ params: { page: pages[key].slug }, props: { key } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ key: IndexedPageKey }> = ({ props }) => new Response(pageMarkdown(props.key));
