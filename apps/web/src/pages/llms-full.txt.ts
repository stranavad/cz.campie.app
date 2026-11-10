import type { APIRoute } from 'astro';

import { llmsFullTxt } from '../lib/markdown.ts';

export const GET: APIRoute = () => new Response(llmsFullTxt());
