import { honeypotField } from './contact.schema.ts';
import { RESEND_URL, singleLine, STATUS, verifyTurnstile, type ContactDeps, type ContactError } from './contact.ts';
import type { Env } from './env.ts';
import { webySchema, type WebyRequest } from './weby.schema.ts';

// The form on /weby-pro-tabory answers as the contact form does: JSON for the page's script, otherwise a
// redirect to a result page, so it also works as a plain HTML form.
function reply(request: Request, error: ContactError | null): Response {
  if (request.headers.get('Accept')?.includes('application/json') === true) {
    return Response.json(error === null ? { ok: true } : { ok: false, error }, {
      status: error === null ? 200 : STATUS[error],
    });
  }
  const target = new URL(error === null ? '/weby-pro-tabory/odeslano' : '/weby-pro-tabory/chyba', request.url);
  return Response.redirect(target.toString(), 303);
}

async function send(request: WebyRequest, env: Env, deps: ContactDeps): Promise<boolean> {
  try {
    const response = await deps.fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: request.email,
        subject: singleLine(`Weby pro tábory: ${request.url}`),
        text: `Tři návrhy webu zdarma.\n\nSoučasný web: ${request.url}\nE-mail: ${request.email}\n`,
      }),
    });
    if (!response.ok) {
      console.error(`Resend answered ${response.status}`);
    }
    return response.ok;
  } catch {
    console.error('Resend unreachable');
    return false;
  }
}

// POST /api/weby: a request for three website proposals, mailed to CONTACT_TO with the organiser as
// Reply-To. It shares the contact form's rate limit binding under its own key.
export async function handleWeby(request: Request, env: Env, deps: ContactDeps): Promise<Response> {
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
  const trap = form.get(honeypotField);
  if (typeof trap === 'string' && trap !== '') {
    return reply(request, null);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success: withinLimit } = await env.CONTACT_LIMITER.limit({ key: `weby:${ip}` });
  if (!withinLimit) {
    return reply(request, 'rate_limited');
  }

  const fields = Object.fromEntries([...form.entries()].filter((entry) => typeof entry[1] === 'string'));
  const parsed = webySchema.safeParse(fields);
  if (!parsed.success) {
    return reply(request, 'invalid');
  }

  if (!(await verifyTurnstile(parsed.data['cf-turnstile-response'], ip, env, deps))) {
    return reply(request, 'captcha');
  }

  return reply(request, (await send(parsed.data, env, deps)) ? null : 'send_failed');
}
