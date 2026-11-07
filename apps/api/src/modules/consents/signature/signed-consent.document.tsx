import type { ConsentItemKind } from '@repo/schema/consents';

import { DocumentLayout, Fact } from '../../../core/documents/document-layout.tsx';
import type { DocumentTemplate } from '../../../core/documents/document.service.ts';

export interface SignedConsentProps {
  readonly campName: string;
  readonly participant: { readonly name: string; readonly birthDate: string };
  readonly consent: {
    readonly title: string;
    readonly version: number;
    readonly introduction: string;
    readonly withdrawable: boolean;
    // The attached PDF's SHA-256, hex, or null without one.
    readonly fileSha256: string | null;
  };
  readonly items: readonly { readonly kind: ConsentItemKind; readonly text: string; readonly answer: boolean | null }[];
  readonly signer: {
    readonly name: string;
    readonly place: string;
    readonly email: string;
    readonly signedAt: string;
    readonly ipAddress: string;
    readonly userAgent: string;
  };
}

const PAGE_STYLES = `
  .consent { font-size: 9.5pt; line-height: 1.4; }
  .consent h2 { font-size: 11pt; margin: 10pt 0 4pt; }
  .consent p, .consent li { white-space: pre-line; }
  .consent ol { padding-left: 14pt; }
  .consent li { margin-bottom: 4pt; }
  .consent .answer { font-weight: 700; }
  .consent .evidence { font-size: 8pt; word-break: break-all; }
`;

/**
 * Word an item's answer as printed.
 * @param kind the item's kind
 * @param answer the answer, or null for an information item
 */
function answerOf(kind: ConsentItemKind, answer: boolean | null): string | null {
  if (kind === 'information' || answer === null) {
    return null;
  }

  if (kind === 'must_agree') {
    return 'Souhlasím';
  }

  return answer ? 'Ano' : 'Ne';
}

// A signed Consent: its full wording, the answers, and the evidence of the simple electronic signature.
// Wording is the platform's; camp data always follows a label.
export const SignedConsentDocument: DocumentTemplate<SignedConsentProps> = ({ letterhead, ...props }) => (
  <DocumentLayout letterhead={letterhead} title="Podepsaný souhlas">
    <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
    <div className="consent">
      <Fact label="Tábor">{props.campName}</Fact>
      <Fact label="Účastník">{props.participant.name}</Fact>
      <Fact label="Datum narození">{props.participant.birthDate}</Fact>
      <h2>{props.consent.title}</h2>
      <Fact label="Verze">{String(props.consent.version)}</Fact>
      {props.consent.introduction === '' ? null : <p>{props.consent.introduction}</p>}
      {props.consent.fileSha256 === null ? null : (
        <Fact label="Přiložený dokument (SHA-256)">
          <span className="evidence">{props.consent.fileSha256}</span>
        </Fact>
      )}
      <ol>
        {props.items.map((item, index) => {
          const answer = answerOf(item.kind, item.answer);

          return (
            <li key={index}>
              {item.text}
              {answer === null ? null : <div className="answer">{answer}</div>}
            </li>
          );
        })}
      </ol>
      <p>{props.consent.withdrawable ? 'Tento souhlas lze kdykoli odvolat.' : 'Tento souhlas nelze odvolat.'}</p>
      <h2>Podpis</h2>
      <Fact label="Podepsal(a)">{props.signer.name}</Fact>
      <Fact label="Místo">{props.signer.place}</Fact>
      <Fact label="Datum a čas">{props.signer.signedAt}</Fact>
      <Fact label="Ověřený e-mail">{props.signer.email}</Fact>
      <Fact label="IP adresa">{props.signer.ipAddress}</Fact>
      <Fact label="Prohlížeč">
        <span className="evidence">{props.signer.userAgent}</span>
      </Fact>
      <p className="evidence">
        Podepsáno prostou elektronickou formou: napsáním jména a místa po přihlášení odkazem zaslaným na uvedený e-mail.
      </p>
    </div>
  </DocumentLayout>
);
