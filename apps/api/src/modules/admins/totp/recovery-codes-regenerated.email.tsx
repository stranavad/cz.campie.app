import { EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

// A security notice: new recovery codes replaced the admin's, so a change they did not make shows.
export const RecoveryCodesRegeneratedEmail = defineEmail<Record<string, never>>({
  stream: 'notification',
  subject: () => 'Nové záložní kódy pro dvoufázové přihlášení',
  render: ({ brand }) => (
    <EmailLayout
      brand={brand}
      title="Nové záložní kódy pro dvoufázové přihlášení"
      preview="Původní záložní kódy už neplatí."
    >
      <EmailText
        text="Na stránce Můj účet jste si vytvořili nové záložní kódy pro dvoufázové přihlášení. Původní kódy už neplatí. Pokud jste to nebyli vy, změňte si prosím hned heslo a dejte nám vědět."
        values={{}}
      />
    </EmailLayout>
  ),
});
