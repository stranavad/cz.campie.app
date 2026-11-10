import { contactSchema, type ContactMessage } from './contact.schema.ts';
import type { Env } from './env.ts';

export type ContactError = 'forbidden' | 'invalid' | 'rate_limited' | 'captcha' | 'send_failed';

export interface ContactDeps {
  fetch: (input: string, init: RequestInit) => Promise<Response>;
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';
// The honeypot field: hidden from people, so only a bot fills it in.
const TRAP_FIELD = 'web';

const STATUS = { forbidden: 403, invalid: 400, rate_limited: 429, captcha: 400, send_failed: 502 } satisfies Record<
  ContactError,
  number
>;

// The form's answer: JSON for the enhancement script, otherwise a redirect to a result page, so the form
// also works as a plain HTML form.
function reply(request: Request, error: ContactError | null): Response {
  if (request.headers.get('Accept')?.includes('application/json') === true) {
    return Response.json(error === null ? { ok: true } : { ok: false, error }, {
      status: error === null ? 200 : STATUS[error],
    });
  }
  const target = new URL(error === null ? '/kontakt/odeslano' : '/kontakt/chyba', request.url);
  return Response.redirect(target.toString(), 303);
}

async function verifyTurnstile(token: string, ip: string, env: Env, deps: ContactDeps): Promise<boolean> {
  const body = new FormData();
  body.set('secret', env.TURNSTILE_SECRET_KEY);
  body.set('response', token);
  body.set('remoteip', ip);
  try {
    const response = await deps.fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
    const result: unknown = await response.json();
    return typeof result === 'object' && result !== null && 'success' in result && result.success === true;
  } catch {
    return false;
  }
}

// Header values come from the visitor: no line breaks or other control characters.
const singleLine = (text: string) => text.replace(/\p{Cc}+/gu, ' ').trim();

async function send(message: ContactMessage, env: Env, deps: ContactDeps): Promise<boolean> {
  const organisation = message.organisation === '' ? '' : ` (${message.organisation})`;
  try {
    const response = await deps.fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: message.email,
        subject: singleLine(`Zpráva z webu: ${message.name}${organisation}`),
        text: `${message.message}\n\n${message.name}${organisation}\n${message.email}\n`,
      }),
    });
    if (!response.ok) {
      // The status only: the body may echo the visitor's message.
      console.error(`Resend answered ${response.status}`);
    }
    return response.ok;
  } catch {
    console.error('Resend unreachable');
    return false;
  }
}

// POST /api/kontakt: the contact form, mailed to CONTACT_TO with the visitor as Reply-To.
export async function handleContact(request: Request, env: Env, deps: ContactDeps): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    return reply(request, 'forbidden');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, 'invalid');
  }

  // A bot gets the same answer as a person, so it learns nothing.
  const trap = form.get(TRAP_FIELD);
  if (typeof trap === 'string' && trap !== '') {
    return reply(request, null);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success: withinLimit } = await env.CONTACT_LIMITER.limit({ key: ip });
  if (!withinLimit) {
    return reply(request, 'rate_limited');
  }

  const fields = Object.fromEntries([...form.entries()].filter((entry) => typeof entry[1] === 'string'));
  const parsed = contactSchema.safeParse(fields);
  if (!parsed.success) {
    return reply(request, 'invalid');
  }

  if (!(await verifyTurnstile(parsed.data['cf-turnstile-response'], ip, env, deps))) {
    return reply(request, 'captcha');
  }

  return reply(request, (await send(parsed.data, env, deps)) ? null : 'send_failed');
}
