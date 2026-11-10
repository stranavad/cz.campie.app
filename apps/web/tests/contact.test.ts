import { describe, expect, it } from 'vitest';

import { handleContact, type ContactDeps } from '../worker/contact.ts';
import type { Env } from '../worker/env.ts';

const FORM_URL = 'https://campie.cz/api/kontakt';
const valid = {
  name: 'Testovací Vedoucí',
  organisation: 'Tábor Příklad',
  email: 'vedouci@example.com',
  message: 'Dobrý den, rádi bychom Campie vyzkoušeli.',
  'cf-turnstile-response': 'test-token',
};

function setup({ captcha = true, withinLimit = true } = {}) {
  const sent: { to: string[]; reply_to: string; subject: string }[] = [];
  const deps: ContactDeps = {
    fetch: (url, init) => {
      if (url.includes('siteverify')) {
        return Promise.resolve(Response.json({ success: captcha }));
      }
      sent.push(JSON.parse(typeof init.body === 'string' ? init.body : '') as (typeof sent)[number]);
      return Promise.resolve(Response.json({ id: 'test' }));
    },
  };
  const env: Env = {
    RESEND_API_KEY: 're_test',
    TURNSTILE_SECRET_KEY: 'test-secret',
    CONTACT_TO: 'info@campie.cz',
    CONTACT_FROM: 'Campie web <web@posta.campie.cz>',
    CONTACT_LIMITER: { limit: () => Promise.resolve({ success: withinLimit }) },
  };
  return { sent, deps, env };
}

function post(fields: Record<string, string>, headers: Record<string, string> = {}) {
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    body.set(name, value);
  }
  return new Request(FORM_URL, { method: 'POST', body, headers });
}

describe('POST /api/kontakt', () => {
  it('mails the message to CONTACT_TO with the visitor as Reply-To and redirects to the thank-you page', async () => {
    const { sent, deps, env } = setup();

    const response = await handleContact(post(valid), env, deps);

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe('https://campie.cz/kontakt/odeslano');
    expect(sent).toEqual([
      expect.objectContaining({
        to: ['info@campie.cz'],
        reply_to: 'vedouci@example.com',
        subject: 'Zpráva z webu: Testovací Vedoucí (Tábor Příklad)',
      }),
    ]);
  });

  it('sends nothing when Turnstile rejects the token', async () => {
    const { sent, deps, env } = setup({ captcha: false });

    const response = await handleContact(post(valid), env, deps);

    expect(response.headers.get('Location')).toBe('https://campie.cz/kontakt/chyba');
    expect(sent).toEqual([]);
  });

  it('answers a filled honeypot like a success and sends nothing', async () => {
    const { sent, deps, env } = setup();

    const response = await handleContact(post({ ...valid, web: 'https://spam.example.com' }), env, deps);

    expect(response.headers.get('Location')).toBe('https://campie.cz/kontakt/odeslano');
    expect(sent).toEqual([]);
  });

  it('rejects an invalid e-mail address', async () => {
    const { sent, deps, env } = setup();

    const response = await handleContact(
      post({ ...valid, email: 'neni-to-adresa' }, { Accept: 'application/json' }),
      env,
      deps,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'invalid' });
    expect(sent).toEqual([]);
  });

  it('answers 429 once the rate limit is used up', async () => {
    const { sent, deps, env } = setup({ withinLimit: false });

    const response = await handleContact(post(valid, { Accept: 'application/json' }), env, deps);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ ok: false, error: 'rate_limited' });
    expect(sent).toEqual([]);
  });

  it('refuses a post from another origin', async () => {
    const { sent, deps, env } = setup();

    const response = await handleContact(post(valid, { Origin: 'https://evil.example.com' }), env, deps);

    expect(response.headers.get('Location')).toBe('https://campie.cz/kontakt/chyba');
    expect(sent).toEqual([]);
  });
});
