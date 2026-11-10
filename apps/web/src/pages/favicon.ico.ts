import type { APIRoute } from 'astro';

import { faviconIco } from '../lib/og.ts';

export const GET: APIRoute = async () => new Response(new Uint8Array(await faviconIco()));
