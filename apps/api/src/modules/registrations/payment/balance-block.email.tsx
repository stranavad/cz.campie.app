import { czk } from '@repo/schema/shared';

import { EMAIL_CLASS, EMAIL_COLOURS, EMAIL_PARAGRAPH } from '../../../core/emails/email-layout.tsx';

// The balance a Registration stands at, below the Camp's wording: what is left to pay, or what the camp owes
// back.
export function BalanceBlock({ balance }: { balance: number }) {
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
        fontWeight: 600,
        color: EMAIL_COLOURS.ink,
      }}
    >
      {balance < 0 ? `Přeplatek: ${czk(-balance)}` : `Zbývá zaplatit: ${czk(balance)}`}
    </p>
  );
}
