import { czk } from '@repo/schema/shared';

import { EMAIL_CLASS, EMAIL_COLOURS, EMAIL_PARAGRAPH } from '../../../core/emails/email-layout.tsx';

// The platform's fixed line in the Camp's new Registration email, there whatever the Camp wrote: the
// Registration asks for an invoice.
export function InvoiceRequestNotice({ companyName, amount }: { companyName: string; amount: number }) {
  return (
    <p
      className={`${EMAIL_CLASS.line} ${EMAIL_CLASS.ink}`}
      style={{
        ...EMAIL_PARAGRAPH,
        margin: '0 0 22px',
        padding: '12px 0',
        borderTop: `1px solid ${EMAIL_COLOURS.line}`,
        borderBottom: `1px solid ${EMAIL_COLOURS.line}`,
        fontSize: '15px',
        color: EMAIL_COLOURS.ink,
      }}
    >
      <span className={EMAIL_CLASS.muted} style={{ color: EMAIL_COLOURS.muted }}>
        Žádost o fakturu:{' '}
      </span>
      <strong>{`${companyName}, ${czk(amount)}`}</strong>
    </p>
  );
}
