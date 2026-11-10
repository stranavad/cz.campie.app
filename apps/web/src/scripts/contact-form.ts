import { contactStatus } from '../content/contact.ts';

// Sends the contact form without leaving the page and says how it went. Without this script the form
// still posts and the Worker redirects to a result page.
declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
const status = form?.querySelector<HTMLElement>('[data-status]');
const button = form?.querySelector<HTMLButtonElement>('button[type="submit"]');

async function send(target: HTMLFormElement): Promise<string> {
  try {
    const response = await fetch(target.action, {
      method: 'POST',
      body: new FormData(target),
      headers: { Accept: 'application/json' },
    });
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (result.ok) {
      target.reset();
      return contactStatus.sent;
    }
    const errors: Record<string, string> = contactStatus.errors;
    return errors[result.error ?? ''] ?? contactStatus.failed;
  } catch {
    return contactStatus.failed;
  }
}

if (form && status && button) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = contactStatus.sending;
    void send(form).then((message) => {
      status.textContent = message;
      button.disabled = false;
      // A Turnstile token is good for one submission.
      window.turnstile?.reset();
    });
  });
}
