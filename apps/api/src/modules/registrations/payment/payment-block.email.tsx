import type { PaymentInstructions } from '@repo/schema/payments';
import { czechDate, czk } from '@repo/schema/shared';

// The content ID the QR platba image is sent under.
export const QR_PLATBA_CONTENT_ID = 'qr-platba';

const FONT = 'Arial, Helvetica, sans-serif';
const MUTED = '#555555';
const RULE = '#e5e5e5';

const line = { fontFamily: FONT, fontSize: '14px', lineHeight: '22px', margin: 0 } as const;

// One fact per paragraph, so the plain text version reads line by line too.
function Row({ label, children }: { label: string; children: string }) {
  return (
    <p style={line}>
      <span style={{ color: MUTED }}>{label}: </span>
      <strong>{children}</strong>
    </p>
  );
}

// The platform's fixed payment details of a Registration, below whatever the Camp wrote: they are there even
// when its text names no amount. The QR platba image comes with the message as an inline attachment.
export function PaymentBlock({ payment }: { payment: PaymentInstructions }) {
  return (
    <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '12px' }}>
      <p style={{ ...line, fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Platba</p>
      {payment.account === null ? null : <Row label="Číslo účtu">{payment.account}</Row>}
      <Row label="Variabilní symbol">{payment.variableSymbol}</Row>
      <Row label={payment.kind === 'deposit' ? 'Záloha k úhradě' : 'Částka k úhradě'}>{czk(payment.amount)}</Row>
      {payment.dueDate === null || payment.amount === 0 ? null : (
        <Row label="Splatnost">{czechDate(payment.dueDate)}</Row>
      )}
      {payment.balance === null ? null : (
        <>
          <Row label="Doplatek">
            {payment.balance.dueDate === null
              ? czk(payment.balance.amount)
              : `${czk(payment.balance.amount)}, splatnost ${czechDate(payment.balance.dueDate)}`}
          </Row>
          <Row label="Nebo vše najednou">{czk(payment.balance.outstanding)}</Row>
        </>
      )}
      {payment.invoiced === null ? null : (
        <Row label={`Fakturováno firmě ${payment.invoiced.companyName}`}>{czk(payment.invoiced.amount)}</Row>
      )}
      {payment.account === null ? (
        <p style={{ ...line, color: MUTED }}>Číslo účtu pro platbu pošle pořadatel tábora.</p>
      ) : null}
      {payment.qrPlatba === null ? null : (
        <p style={{ ...line, marginTop: '12px' }}>
          <img src={`cid:${QR_PLATBA_CONTENT_ID}`} width={160} height={160} alt="QR platba" />
        </p>
      )}
    </div>
  );
}
