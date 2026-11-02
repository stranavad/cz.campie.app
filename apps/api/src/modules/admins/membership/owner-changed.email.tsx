import { EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';
import type { OwnerChange } from './owner-changed.job.ts';

const CHANGES: Readonly<Record<OwnerChange, string>> = {
  promoted: 'přidání role vlastníka',
  demoted: 'odebrání role vlastníka',
  removed: 'odebrání ze správy organizace',
};

export interface OwnerChangedProps {
  organisation: string;
  email: string;
  change: OwnerChange;
  changedBy: string | null;
}

// A security notice to every Owner: who gained or lost the Owner role, and who did it. Facts follow their
// labels, so the wording needs no declension.
export const OwnerChangedEmail = defineEmail<OwnerChangedProps>({
  stream: 'notification',
  subject: ({ organisation }) => `Změna vlastníků organizace ${organisation}`,
  render: ({ brand, organisation, email, change, changedBy }) => (
    <EmailLayout brand={brand} title="Změna vlastníků organizace" preview={organisation}>
      <EmailText
        text={'Organizace: {{organisation}}\nSprávce: {{email}}\nZměna: {{change}}\nAutor změny: {{changedBy}}'}
        values={{ organisation, email, change: CHANGES[change], changedBy: changedBy ?? 'provozovatel platformy' }}
      />
      <EmailText
        text="Vlastník má přístup ke všem údajům organizace a spravuje její uživatele. Pokud změnu nečekáte, ověřte ji prosím u ostatních vlastníků."
        values={{}}
      />
    </EmailLayout>
  ),
});
