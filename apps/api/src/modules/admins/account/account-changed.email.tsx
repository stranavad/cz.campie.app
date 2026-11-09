import { EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

// What each security notice says. A change the admin did not make shows, and they know what to do.
const NOTICES = {
  password: {
    subject: 'Heslo k vašemu účtu bylo změněno',
    text: 'Na stránce Můj účet jste si změnili heslo. Ostatní přihlášení k účtu jsme ukončili. Pokud jste to nebyli vy, obnovte si prosím hned heslo přes zapomenuté heslo.',
  },
  email: {
    subject: 'E-mail vašeho účtu byl změněn',
    text: 'Váš účet se od teď přihlašuje jiným e-mailem a na tuto adresu už nepatří. Pokud jste e-mail neměnili, obraťte se prosím hned na vlastníka své organizace.',
  },
  totp: {
    subject: 'Dvoufázové přihlášení je v novém telefonu',
    text: 'Na stránce Můj účet jste si přesunuli dvoufázové přihlášení do nové ověřovací aplikace. Kódy z původní aplikace už neplatí, záložní kódy zůstávají. Pokud jste to nebyli vy, změňte si prosím hned heslo a obraťte se na vlastníka své organizace.',
  },
} as const;

// A security notice after a change to how the admin signs in, without any of the new values.
export const AccountChangedEmail = defineEmail<{ change: keyof typeof NOTICES }>({
  stream: 'notification',
  subject: ({ change }) => NOTICES[change].subject,
  render: ({ brand, change }) => (
    <EmailLayout brand={brand} title={NOTICES[change].subject} preview={NOTICES[change].subject}>
      <EmailText text={NOTICES[change].text} values={{}} />
    </EmailLayout>
  ),
});
