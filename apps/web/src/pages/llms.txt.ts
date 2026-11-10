import type { APIRoute } from 'astro';

import { llmsTxt } from '../lib/markdown.ts';

export const GET: APIRoute = () => new Response(llmsTxt());
