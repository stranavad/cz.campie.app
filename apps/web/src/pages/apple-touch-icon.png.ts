import type { APIRoute } from 'astro';

import { site } from '../content/site.ts';
import { iconPng } from '../lib/og.ts';

// iOS rounds the corners itself and shows no transparency: the mark on the header's green.
export const GET: APIRoute = async () => new Response(new Uint8Array(await iconPng(180, site.themeColor.light)));
