import { czk } from '@repo/schema/shared';

const FONT = 'Arial, Helvetica, sans-serif';
const RULE = '#e5e5e5';

// The balance a Registration stands at, below the Camp's wording: what is left to pay, or what the camp owes
// back.
export function BalanceBlock({ balance }: { balance: number }) {
  return (
    <p style={{ borderTop: `1px solid ${RULE}`, paddingTop: '12px', margin: 0, fontFamily: FONT, fontSize: '14px' }}>
      {balance < 0 ? `Přeplatek: ${czk(-balance)}` : `Zbývá zaplatit: ${czk(balance)}`}
    </p>
  );
}
