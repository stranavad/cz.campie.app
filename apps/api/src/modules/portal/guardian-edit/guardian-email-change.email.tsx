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

// The notice to a guardian's previous address that it no longer receives the Registration's mail.
export const EmailChangeNoticeEmail = defineEmail<{ campName: string; email: string }>({
  stream: 'notification',
  subject: () => 'Změna e-mailové adresy u přihlášky',
  render: ({ brand, campName, email }) => (
    <EmailLayout brand={brand} title="Změna e-mailové adresy" preview="E-mailová adresa u přihlášky byla změněna.">
      <EmailText
        text={
          'E-mailová adresa zákonného zástupce u přihlášky byla změněna.\nTábor: {{tabor}}\nNová adresa: {{adresa}}\n\nPokud o změně nevíte, napište prosím pořadateli tábora; kontakt najdete níže.'
        }
        values={{ tabor: campName, adresa: email }}
      />
    </EmailLayout>
  ),
});
