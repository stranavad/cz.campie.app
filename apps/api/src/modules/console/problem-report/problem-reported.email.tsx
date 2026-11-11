import { EmailLayout, EMAIL_FACT as fact } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

export interface ProblemReportedProps {
  readonly kind: 'admin' | 'guardian';
  readonly organisation: string;
  readonly from: string;
  readonly pageUrl: string;
  readonly text: string;
}

// Tells the Platform operator of a new report. Facts follow their labels, so the wording needs no
// declension.
export const ProblemReportedEmail = defineEmail<ProblemReportedProps>({
  stream: 'notification',
  subject: ({ kind, organisation }) =>
    `${kind === 'admin' ? 'Zpětná vazba od správce' : 'Technický problém od rodiče'}: ${organisation}`,
  render: ({ brand, kind, organisation, from, pageUrl, text }) => (
    <EmailLayout
      brand={brand}
      title={kind === 'admin' ? 'Zpětná vazba od správce' : 'Technický problém od rodiče'}
      preview={organisation}
    >
      <p style={fact}>
        <strong>Organizace:</strong> {organisation}
      </p>
      <p style={fact}>
        <strong>Od:</strong> {from}
      </p>
      <p style={fact}>
        <strong>Stránka:</strong> {pageUrl}
      </p>
      <p style={{ ...fact, whiteSpace: 'pre-line' }}>{text}</p>
    </EmailLayout>
  ),
});
