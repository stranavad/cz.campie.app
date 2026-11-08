import type { ReactNode } from 'react';

import type { PaymentInstructions } from '@repo/schema/payments';
import type { PriceLineKind } from '@repo/schema/pricing';
import { czk } from '@repo/schema/shared';

import { DocumentLayout, Fact } from '../../../core/documents/document-layout.tsx';
import type { DocumentTemplate } from '../../../core/documents/document.service.ts';

// A question of the form and its answer as printed, both cut to fit.
export interface PrihlaskaRow {
  readonly label: string;
  readonly value: string;
}

export interface PrihlaskaLine {
  readonly kind: PriceLineKind;
  // The form answer's label or the code; null for the platform's own wording of the kind.
  readonly label: string | null;
  // The Participant the line is for, or null for the whole Registration.
  readonly participant: string | null;
  readonly amount: number;
}

// The payment instructions as printed: dates written the Czech way, each QR platba as SVG markup.
export interface PrihlaskaPayment extends Omit<PaymentInstructions, 'qrPlatba' | 'balance'> {
  readonly qrSvg: string | null;
  // While it differs from the amount due now: the rest after the Deposits and all that is outstanding,
  // with the QR platba of all outstanding.
  readonly balance:
    (Omit<NonNullable<PaymentInstructions['balance']>, 'qrPlatba'> & { readonly qrSvg: string | null }) | null;
}

export interface PrihlaskaProps {
  readonly campName: string;
  readonly turnus: { readonly name: string; readonly dates: string; readonly place: string };
  readonly submittedAt: string;
  readonly participant: {
    readonly name: string;
    readonly birthDate: string;
    readonly answers: readonly PrihlaskaRow[];
  };
  readonly otherParticipants: readonly string[];
  readonly guardians: readonly { readonly name: string; readonly email: string; readonly phone: string | null }[];
  readonly registrationAnswers: readonly PrihlaskaRow[];
  readonly lines: readonly PrihlaskaLine[];
  readonly total: number;
  readonly payment: PrihlaskaPayment;
  readonly declarations: readonly { readonly text: string; readonly accepted: boolean }[];
}

const KIND_LABELS: Readonly<Record<PriceLineKind, string>> = {
  base_price: 'Základní cena',
  early_bird_price: 'Cena při včasném přihlášení',
  paid_extra: 'Příplatek',
  claimed_discount: 'Sleva',
  sibling_discount: 'Sourozenecká sleva',
  discount_code: 'Slevový kód',
  zero_floor: 'Vyrovnání na nulu',
};

// One A4 page whatever was answered: the content stops well above the page's foot rather than spill onto
// a second, leaving room for a letterhead whose name wraps. The price and payment come first, so a cut
// only ever takes answers or declarations.
const PAGE_STYLES = `
  .prihlaska { max-height: 205mm; overflow: hidden; font-size: 8.5pt; line-height: 1.35; }
  .prihlaska h2 { font-size: 10pt; margin: 8pt 0 3pt; }
  .prihlaska .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14pt; }
  .prihlaska table { width: 100%; border-collapse: collapse; }
  .prihlaska td { padding: 1.5pt 0; vertical-align: top; }
  .prihlaska td.amount { text-align: right; white-space: nowrap; }
  .prihlaska .one-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .prihlaska .payment { display: flex; gap: 12pt; align-items: flex-start; }
  .prihlaska .qrs { display: flex; gap: 6pt; }
  .prihlaska .qr { flex: 0 0 32mm; width: 32mm; margin: 0; text-align: center; font-size: 7.5pt; }
  .prihlaska .qr div { width: 32mm; height: 32mm; }
  .prihlaska .qr svg { width: 100%; height: 100%; }
`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="keep-together">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: readonly PrihlaskaRow[] }) {
  return rows.map(({ label, value }, index) => (
    <Fact key={index} label={label}>
      {value}
    </Fact>
  ));
}

function Qr({ svg, caption }: { svg: string; caption: string }) {
  return (
    <figure className="qr">
      {/* The SVG is the QR library's own markup of the payment; nothing a guardian typed is markup in it. */}
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Payment({ payment }: { payment: PrihlaskaPayment }) {
  if (payment.account === null) {
    return (
      <>
        <Fact label="Variabilní symbol">{payment.variableSymbol}</Fact>
        <p>Číslo účtu pro platbu pošle pořadatel tábora.</p>
      </>
    );
  }

  return (
    <div className="payment">
      <div style={{ flex: 1 }}>
        <Fact label="Způsob platby">Bankovní převod</Fact>
        <Fact label="Číslo účtu">{payment.account}</Fact>
        <Fact label="Variabilní symbol">{payment.variableSymbol}</Fact>
        <Fact label={payment.kind === 'deposit' ? 'Záloha k úhradě' : 'Částka k úhradě'}>{czk(payment.amount)}</Fact>
        {payment.dueDate === null || payment.amount === 0 ? null : <Fact label="Splatnost">{payment.dueDate}</Fact>}
        {payment.balance === null ? null : (
          <>
            <Fact label="Doplatek">
              {czk(payment.balance.amount)}
              {payment.balance.dueDate === null ? null : `, splatnost ${payment.balance.dueDate}`}
            </Fact>
            <Fact label="Nebo vše najednou">{czk(payment.balance.outstanding)}</Fact>
          </>
        )}
      </div>
      <div className="qrs">
        {payment.qrSvg === null ? null : (
          <Qr svg={payment.qrSvg} caption={payment.kind === 'deposit' ? 'Záloha' : 'K úhradě'} />
        )}
        {payment.balance === null || payment.balance.qrSvg === null ? null : (
          <Qr svg={payment.balance.qrSvg} caption="Vše najednou" />
        )}
      </div>
    </div>
  );
}

// The Přihláška of one Participant: a snapshot of the submission with its price and payment instructions.
// Wording is the platform's; camp data always follows a label, so it needs no declension.
export const PrihlaskaDocument: DocumentTemplate<PrihlaskaProps> = ({ letterhead, ...props }) => (
  <DocumentLayout letterhead={letterhead} title="Přihláška">
    <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
    <div className="prihlaska">
      <div className="columns">
        <div>
          <Fact label="Tábor">{props.campName}</Fact>
          <Fact label="Turnus">{props.turnus.name}</Fact>
          <Fact label="Termín">{props.turnus.dates}</Fact>
          <Fact label="Místo">{props.turnus.place}</Fact>
        </div>
        <div>
          <Fact label="Dítě">{props.participant.name}</Fact>
          <Fact label="Datum narození">{props.participant.birthDate}</Fact>
          <Fact label="Odesláno">{props.submittedAt}</Fact>
        </div>
      </div>
      <Section title="Platba">
        <Payment payment={props.payment} />
      </Section>
      <Section title="Cena přihlášky">
        <table>
          <tbody>
            {props.lines.map((line, index) => (
              <tr key={index}>
                <td>
                  {line.label ?? KIND_LABELS[line.kind]}
                  {line.participant === null ? null : ` (${line.participant})`}
                </td>
                <td className="amount">{czk(line.amount)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Celkem</strong>
              </td>
              <td className="amount">
                <strong>{czk(props.total)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
      <div className="columns">
        <Section title="Údaje o dítěti">
          <Rows rows={props.participant.answers} />
          {props.otherParticipants.length === 0 ? null : (
            <Fact label="Další děti v přihlášce">{props.otherParticipants.join(', ')}</Fact>
          )}
        </Section>
        <Section title="Zákonní zástupci">
          {props.guardians.map((guardian, index) => (
            <div key={index}>
              <Fact label="Jméno">{guardian.name}</Fact>
              <Fact label="E-mail">{guardian.email}</Fact>
              {guardian.phone === null ? null : <Fact label="Telefon">{guardian.phone}</Fact>}
            </div>
          ))}
          <Rows rows={props.registrationAnswers} />
        </Section>
      </div>
      {props.declarations.length === 0 ? null : (
        <Section title="Prohlášení">
          {props.declarations.map((declaration, index) => (
            <div key={index} className="one-line">
              {declaration.accepted ? '☑' : '☐'} {declaration.text}
            </div>
          ))}
        </Section>
      )}
    </div>
  </DocumentLayout>
);
