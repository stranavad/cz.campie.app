import { EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

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
