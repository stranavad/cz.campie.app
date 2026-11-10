import { czk } from '@repo/schema/shared';

const line = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', lineHeight: '22px', margin: 0 } as const;

// The platform's fixed line in the Camp's new Registration email, there whatever the Camp wrote: the
// Registration asks for an invoice.
export function InvoiceRequestNotice({ companyName, amount }: { companyName: string; amount: number }) {
  return (
    <p style={{ ...line, borderTop: '1px solid #e5e5e5', paddingTop: '12px' }}>
      <span style={{ color: '#555555' }}>Žádost o fakturu: </span>
      <strong>{`${companyName}, ${czk(amount)}`}</strong>
    </p>
  );
}
