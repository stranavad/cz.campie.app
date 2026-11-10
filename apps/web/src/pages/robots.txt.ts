import type { APIRoute } from 'astro';

import { buildRobots } from '../lib/headers.ts';
import { siteEnv } from '../lib/site-env.ts';

export const GET: APIRoute = () => new Response(buildRobots(siteEnv));
