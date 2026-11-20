import type { APIRoute } from 'astro';

import { templateBySlug } from '../../content/kit/documents/index.ts';
import type { DocumentSlug } from '../../content/kit/types.ts';
import { documentStaticPaths } from '../../lib/kit/pages.ts';
import { blankPdf } from '../../lib/kit/pdf-node.ts';

// /vzory/<slug>.pdf: each template's blank document, made at build time by the same PDF definition the
// configurator uses in the browser.
export const getStaticPaths = documentStaticPaths;

export const GET: APIRoute<{ slug: DocumentSlug }> = async ({ props }) =>
  new Response(new Uint8Array((await blankPdf(templateBySlug[props.slug])).output), {
    headers: { 'Content-Type': 'application/pdf' },
  });
