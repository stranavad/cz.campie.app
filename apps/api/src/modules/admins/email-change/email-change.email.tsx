import { EmailAction, EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

// The link that moves an admin's account to this address, sent only to the new address.
export const AdminEmailChangeEmail = defineEmail<{ link: string; validHours: number; productName: string }>({
  stream: 'auth',
  subject: ({ productName }) => `Potvrzení nového e-mailu v ${productName}`,
  render: ({ brand, link, validHours }) => (
    <EmailLayout brand={brand} title="Potvrzení nového e-mailu" preview="Odkaz pro potvrzení nového e-mailu.">
      <EmailText
        text="Někdo si přeje přihlašovat se k účtu touto adresou. Pokud jste to vy, potvrďte ji tímto odkazem:"
        values={{}}
      />
      <EmailAction href={link} label="Potvrdit nový e-mail" />
      <EmailText
        text={`Odkaz platí ${validHours} hodin a lze ho použít jen jednou. Pokud jste o změnu nežádali, e-mail ignorujte, nic se nezmění.`}
        values={{}}
      />
    </EmailLayout>
  ),
});
