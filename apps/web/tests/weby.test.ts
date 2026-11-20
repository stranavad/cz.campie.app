import { describe, expect, it } from 'vitest';

import type { ContactDeps } from '../worker/contact.ts';
import type { Env } from '../worker/env.ts';
import { handleWeby } from '../worker/weby.ts';

const FORM_URL = 'https://campie.cz/api/weby';
const valid = {
  url: 'www.tabor-priklad.cz',
  email: 'vedouci@tabor-priklad.cz',
  'cf-turnstile-response': 'test-token',
};

function setup({ captcha = true } = {}) {
  const sent: { to: string[]; reply_to: string; subject: string; text: string }[] = [];
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
    CONTACT_LIMITER: { limit: () => Promise.resolve({ success: true }) },
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

describe('POST /api/weby', () => {
  it('mails an address without a scheme to CONTACT_TO with the organiser as Reply-To', async () => {
    const { sent, deps, env } = setup();

    const response = await handleWeby(post(valid), env, deps);

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe('https://campie.cz/weby-pro-tabory/odeslano');
    expect(sent).toEqual([
      expect.objectContaining({
        to: ['info@campie.cz'],
        reply_to: 'vedouci@tabor-priklad.cz',
        subject: 'Weby pro tábory: www.tabor-priklad.cz',
      }),
    ]);
  });

  it.each([
    ['an address that is not a website', { url: 'tabor priklad' }],
    ['an invalid e-mail', { email: 'vedouci@tabor' }],
  ])('refuses %s', async (_case, change) => {
    const { sent, deps, env } = setup();

    const response = await handleWeby(post({ ...valid, ...change }, { Accept: 'application/json' }), env, deps);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'invalid' });
    expect(sent).toEqual([]);
  });

  it('sends nothing when Turnstile rejects the token', async () => {
    const { sent, deps, env } = setup({ captcha: false });

    const response = await handleWeby(post(valid), env, deps);

    expect(response.headers.get('Location')).toBe('https://campie.cz/weby-pro-tabory/chyba');
    expect(sent).toEqual([]);
  });
});
