import type { APIRoute } from 'astro';

import { searchIndex } from '../lib/search.ts';

// The kit's search index, fetched by the header's search on first focus.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(searchIndex()), { headers: { 'Content-Type': 'application/json' } });
