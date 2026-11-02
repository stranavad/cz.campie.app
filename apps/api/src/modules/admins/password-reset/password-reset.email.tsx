import { EmailAction, EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

// The link to set a new password, sent only to the account's own address.
export const PasswordResetEmail = defineEmail<{ link: string; validMinutes: number; productName: string }>({
  stream: 'auth',
  subject: ({ productName }) => `Obnovení hesla do ${productName}`,
  render: ({ brand, link, validMinutes }) => (
    <EmailLayout brand={brand} title="Obnovení hesla" preview="Odkaz pro nastavení nového hesla.">
      <EmailText text="Někdo požádal o obnovení hesla k vašemu účtu. Nové heslo nastavíte tímto odkazem:" values={{}} />
      <EmailAction href={link} label="Nastavit nové heslo" />
      <EmailText
        text={`Odkaz platí ${validMinutes} minut a lze ho použít jen jednou. Pokud jste o obnovení nežádali, e-mail ignorujte, vaše heslo zůstává beze změny.`}
        values={{}}
      />
    </EmailLayout>
  ),
});
