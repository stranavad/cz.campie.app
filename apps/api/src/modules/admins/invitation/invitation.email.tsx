import { EmailAction, EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

export interface InvitationProps {
  organisation: string;
  link: string;
  validDays: number;
  productName: string;
}

// The link with which an invitee joins an Organisation's administration. The Organisation follows a label,
// so the wording needs no declension.
export const InvitationEmail = defineEmail<InvitationProps>({
  stream: 'auth',
  subject: ({ organisation }) => `Pozvánka do správy ${organisation}`,
  render: ({ brand, organisation, link, validDays, productName }) => (
    <EmailLayout brand={brand} title="Pozvánka do správy organizace" preview={organisation}>
      <EmailText text="Organizace: {{organisation}}" values={{ organisation }} />
      <EmailText
        text="Dostáváte pozvánku ke správě této organizace v {{productName}}. Pozvánku přijmete tímto odkazem:"
        values={{ productName }}
      />
      <EmailAction href={link} label="Přijmout pozvánku" />
      <EmailText
        text={`Odkaz platí ${validDays} dní a lze ho použít jen jednou. Pokud pozvánku nečekáte, e-mail ignorujte.`}
        values={{}}
      />
    </EmailLayout>
  ),
});
