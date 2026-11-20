import { emailPattern, websitePattern } from '../../worker/weby.fields.ts';
import { trackEvent } from '../lib/analytics.ts';

// Sends each form of Weby pro tábory without leaving the page: checks the two fields first and marks the
// wrong one, then shows the thanks with the typed e-mail, or the alert with the e-mail fallback. Without
// this script the form posts and the Worker redirects to a result page.
const checks = { url: websitePattern, email: emailPattern } as const;
type Field = keyof typeof checks;
const fields = Object.keys(checks) as Field[];

// Turnstile's API, the one call used: a widget's token is good for one submission.
const turnstile = () => (window as { turnstile?: { reset: (widget?: Element) => void } }).turnstile;

function setup(card: HTMLElement): void {
  const form = card.querySelector<HTMLFormElement>('[data-weby-form]');
  const alert = card.querySelector<HTMLElement>('[data-weby-alert]');
  const sent = card.querySelector<HTMLElement>('[data-weby-sent]');
  const sentEmail = card.querySelector<HTMLElement>('[data-weby-sent-email]');
  const again = card.querySelector<HTMLButtonElement>('[data-weby-again]');
  const button = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!form || !alert || !sent || !sentEmail || !again || !button) {
    return;
  }
  form.noValidate = true;

  const input = (field: Field) => form.elements.namedItem(field) as HTMLInputElement;
  const valid = (field: Field) => checks[field].test(input(field).value.trim());
  const mark = (field: Field, wrong: boolean) => {
    input(field).setAttribute('aria-invalid', String(wrong));
    const error = form.querySelector<HTMLElement>(`[data-weby-error="${field}"]`);
    if (error) {
      error.hidden = !wrong;
    }
  };

  for (const field of fields) {
    input(field).addEventListener('input', () => {
      alert.hidden = true;
      // A field marked wrong is checked again as it is corrected.
      if (input(field).getAttribute('aria-invalid') === 'true') {
        mark(field, !valid(field));
      }
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    alert.hidden = true;
    const wrong = fields.filter((field) => !valid(field));
    for (const field of fields) {
      mark(field, wrong.includes(field));
    }
    const first = wrong[0];
    if (first !== undefined) {
      input(first).focus();
      return;
    }
    button.disabled = true;
    const email = input('email').value.trim();
    void fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(async (response) => ((await response.json()) as { ok: boolean }).ok)
      .catch(() => false)
      .then((ok) => {
        button.disabled = false;
        turnstile()?.reset(form.querySelector('.cf-turnstile') ?? undefined);
        if (!ok) {
          alert.hidden = false;
          return;
        }
        trackEvent('weby-sent');
        sentEmail.textContent = email;
        form.hidden = true;
        sent.hidden = false;
        sent.querySelector<HTMLElement>('[tabindex="-1"]')?.focus();
      });
  });

  again.addEventListener('click', () => {
    form.reset();
    for (const field of fields) {
      mark(field, false);
    }
    sent.hidden = true;
    form.hidden = false;
    input('url').focus();
  });
}

for (const card of document.querySelectorAll<HTMLElement>('[data-weby]')) {
  setup(card);
}
