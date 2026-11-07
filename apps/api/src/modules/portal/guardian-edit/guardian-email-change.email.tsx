import { EmailAction, EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

// The link that makes a guardian's new email theirs, sent to the new address only. Camp data follows a
// label, so it needs no declension.
export const EmailChangeConfirmationEmail = defineEmail<{ link: string; campName: string; validHours: number }>({
  stream: 'auth',
  subject: () => 'Potvrzení nové e-mailové adresy',
  render: ({ brand, link, campName, validHours }) => (
    <EmailLayout brand={brand} title="Potvrzení nové e-mailové adresy" preview="Potvrďte novou adresu u přihlášky.">
      <EmailText
        text={
          'U přihlášky na tábor byla zadána tato e-mailová adresa.\nTábor: {{tabor}}\n\nAdresu potvrdíte tímto odkazem:'
        }
        values={{ tabor: campName }}
      />
      <EmailAction href={link} label="Potvrdit adresu" />
      <EmailText
        text={`Odkaz platí ${validHours} hodin. Pokud jste o změnu nežádali, e-mail ignorujte, nic se nezmění.`}
        values={{}}
      />
    </EmailLayout>
  ),
});
