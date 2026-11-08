import { EmailAction, EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

// The link that proves an admin's email theirs, sent only to the account's own address.
export const EmailVerificationEmail = defineEmail<{ link: string; validDays: number; productName: string }>({
  stream: 'auth',
  subject: ({ productName }) => `Ověření e-mailu v ${productName}`,
  render: ({ brand, link, validDays }) => (
    <EmailLayout brand={brand} title="Ověření e-mailu" preview="Odkaz pro ověření vašeho e-mailu.">
      <EmailText text="Potvrďte prosím, že tento e-mail patří vám. Ověříte ho tímto odkazem:" values={{}} />
      <EmailAction href={link} label="Ověřit e-mail" />
      <EmailText
        text={`Odkaz platí ${validDays} dní a lze ho použít jen jednou. Pokud jste si účet nezakládali, e-mail ignorujte.`}
        values={{}}
      />
    </EmailLayout>
  ),
});
