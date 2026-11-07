import { EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

export interface TotpResetProps {
  organisation: string;
  byOperator: boolean;
}

// A security notice: the admin's two-step login was turned off and must be set up again.
export const TotpResetEmail = defineEmail<TotpResetProps>({
  stream: 'notification',
  subject: () => 'Dvoufázové přihlášení bylo vypnuto',
  render: ({ brand, organisation, byOperator }) => (
    <EmailLayout brand={brand} title="Dvoufázové přihlášení bylo vypnuto" preview={organisation}>
      <EmailText
        text={'Organizace: {{organisation}}\nVypnul: {{by}}'}
        values={{ organisation, by: byOperator ? 'provozovatel platformy' : 'vlastník organizace' }}
      />
      <EmailText
        text="Přihlásíte se teď jen heslem; dvoufázové přihlášení si znovu zapnete na stránce Můj účet, a pokud ho organizace vyžaduje, nastavíte si ho při příštím přihlášení. Pokud o vypnutí nevíte, ozvěte se prosím vlastníkovi organizace."
        values={{}}
      />
    </EmailLayout>
  ),
});
