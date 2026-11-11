import type { PaymentInstructions } from '@repo/schema/payments';
import { czechDate, czk } from '@repo/schema/shared';

import {
  EMAIL_CLASS,
  EMAIL_COLOURS,
  EMAIL_FONT,
  EMAIL_MONO,
  EmailTextSeparator,
} from '../../../core/emails/email-layout.tsx';

// The content ID the QR platba image is sent under.
export const QR_PLATBA_CONTENT_ID = 'qr-platba';

const text = { margin: 0, fontFamily: EMAIL_FONT } as const;

// One fact per row, the label on the left and the value on the right; a table of its own, so the plain
// text version reads row by row too.
function Row({ label, mono = false, children }: { label: string; mono?: boolean; children: string }) {
  const cell = { padding: '7px 0', fontFamily: EMAIL_FONT, fontSize: '14px', lineHeight: '20px' } as const;

  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        <tr>
          <td
            className={`${EMAIL_CLASS.line} ${EMAIL_CLASS.muted}`}
            style={{ ...cell, borderTop: `1px solid ${EMAIL_COLOURS.line}`, color: EMAIL_COLOURS.muted }}
          >
            {label}
            <EmailTextSeparator />
          </td>
          <td
            className={`${EMAIL_CLASS.line} ${EMAIL_CLASS.ink}`}
            align="right"
            style={{
              ...cell,
              paddingLeft: '12px',
              borderTop: `1px solid ${EMAIL_COLOURS.line}`,
              fontWeight: 600,
              color: EMAIL_COLOURS.ink,
              ...(mono ? { fontFamily: EMAIL_MONO } : {}),
            }}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// The platform's fixed payment details of a Registration, below whatever the Camp wrote: they are there even
// when its text names no amount. The QR platba image comes with the message as an inline attachment.
export function PaymentBlock({ payment }: { payment: PaymentInstructions }) {
  const note =
    payment.account === null
      ? 'Číslo účtu pro platbu pošle pořadatel tábora.'
      : payment.qrPlatba === null
        ? null
        : 'Naskenujte QR kód v aplikaci banky.';
  const details = (
    <>
      <p
        className={EMAIL_CLASS.muted}
        style={{ ...text, fontSize: '13px', lineHeight: '18px', fontWeight: 600, color: EMAIL_COLOURS.muted }}
      >
        {payment.kind === 'deposit' ? 'Záloha k úhradě' : 'Částka k úhradě'}
      </p>
      <p
        className={EMAIL_CLASS.ink}
        style={{
          ...text,
          fontSize: '30px',
          lineHeight: '36px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: EMAIL_COLOURS.ink,
        }}
      >
        {czk(payment.amount)}
      </p>
      {payment.dueDate === null || payment.amount === 0 ? null : (
        <p
          className={EMAIL_CLASS.body}
          style={{ ...text, fontSize: '14px', lineHeight: '20px', color: EMAIL_COLOURS.body }}
        >
          Splatnost {czechDate(payment.dueDate)}
        </p>
      )}
      <div style={{ height: '10px' }} />
      {payment.account === null ? null : (
        <Row label="Číslo účtu" mono>
          {payment.account}
        </Row>
      )}
      <Row label="Variabilní symbol" mono>
        {payment.variableSymbol}
      </Row>
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
      {note === null ? null : (
        <p
          className={EMAIL_CLASS.muted}
          style={{ ...text, paddingTop: '8px', fontSize: '13px', lineHeight: '18px', color: EMAIL_COLOURS.muted }}
        >
          {note}
        </p>
      )}
    </>
  );

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      className={EMAIL_CLASS.frame}
      style={{
        margin: '8px 0 22px',
        border: `2px solid ${EMAIL_COLOURS.ink}`,
        borderRadius: '12px',
        borderCollapse: 'separate',
      }}
    >
      <tbody>
        <tr>
          {payment.qrPlatba === null ? null : (
            <td width={130} style={{ padding: '20px 0 20px 20px', verticalAlign: 'middle' }}>
              <div
                style={{
                  padding: '8px',
                  width: '112px',
                  backgroundColor: '#ffffff',
                  border: `1px solid ${EMAIL_COLOURS.line}`,
                  borderRadius: '8px',
                }}
              >
                <img
                  src={`cid:${QR_PLATBA_CONTENT_ID}`}
                  width={112}
                  height={112}
                  alt="QR platba"
                  style={{ display: 'block' }}
                />
              </div>
            </td>
          )}
          <td style={{ padding: '20px', verticalAlign: 'middle' }}>{details}</td>
        </tr>
      </tbody>
    </table>
  );
}
