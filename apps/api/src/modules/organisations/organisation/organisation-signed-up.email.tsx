import { EmailLayout, EMAIL_FACT as fact } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';
import type { OrganisationEntity } from '../../../repositories/organisations/organisation/organisation.entity.ts';

// Tells the Platform operator a new Organisation waits for review. Facts follow their labels, so the
// wording needs no declension.
export const OrganisationSignedUpEmail = defineEmail<{ organisation: OrganisationEntity; address: string }>({
  stream: 'notification',
  subject: ({ organisation }) => `Nová organizace čeká na schválení: ${organisation.legalName}`,
  render: ({ brand, organisation, address }) => {
    const facts: [string, string][] = [
      ['Název', organisation.legalName],
      ['IČO', organisation.ico],
      ['DIČ', organisation.vatId ?? '-'],
      ['Sídlo', organisation.address],
      ['Statutární zástupce', organisation.statutoryRepresentative],
      ['Kontaktní e-mail', organisation.contactEmail],
      ['Telefon', organisation.contactPhone],
      ['Fakturační e-mail', organisation.billingEmail],
      ['Adresa', address],
    ];

    return (
      <EmailLayout brand={brand} title="Nová organizace čeká na schválení" preview={organisation.legalName}>
        {facts.map(([label, value]) => (
          <p key={label} style={fact}>
            <strong>{label}:</strong> {value}
          </p>
        ))}
      </EmailLayout>
    );
  },
});
