import { handleContact } from './contact.ts';
import type { Env } from './env.ts';

// Runs only for /api/* (assets.run_worker_first); every other path is a static file from dist/.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/kontakt' && request.method === 'POST') {
      // Wrapped: Workers reject a fetch called with another `this`.
      return handleContact(request, env, { fetch: (input, init) => fetch(input, init) });
    }
    return new Response('Not found', { status: 404 });
  },
};
