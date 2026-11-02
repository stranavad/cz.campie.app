import type { ReactNode } from 'react';

// Who a generated document comes from: the branding it carries and the legal identity it is issued under.
// Every template gets it from the pipeline, so no template names an Organisation by itself.
export interface Letterhead {
  readonly displayName: string;
  readonly accentColour: string;
  // The logo as a data URL, since the renderer fetches nothing; null without a logo.
  readonly logo: string | null;
  readonly legalName: string;
  readonly ico: string;
  readonly address: string;
}

// Layout and font are fixed by the platform; only the letterhead varies.
const TEXT = '#1a1a1a';
const MUTED = '#555555';
const RULE = '#e5e5e5';

// The page geometry lives here rather than in the renderer's options, so the template decides how it prints.
const BASE_STYLES = `
  @page { size: A4; margin: 16mm 18mm 18mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    color: ${TEXT};
    font-family: 'Noto Sans', 'Liberation Sans', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1, h2, p, dl, dd { margin: 0; }
  h1, h2 { break-after: avoid; }
  tr, .keep-together { break-inside: avoid; }
`;

/**
 * The frame of every generated document: the Organisation's logo and display name, its legal identity
 * and the document's title above the template's content.
 */
export function DocumentLayout({
  letterhead,
  title,
  children,
}: {
  letterhead: Letterhead;
  title: string;
  children: ReactNode;
}) {
  return (
    <html lang="cs">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: BASE_STYLES }} />
      </head>
      <body>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12pt',
            paddingBottom: '8pt',
            marginBottom: '18pt',
            borderBottom: `2pt solid ${letterhead.accentColour}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8pt' }}>
            {letterhead.logo === null ? null : (
              <img src={letterhead.logo} alt="" style={{ height: '14mm', width: 'auto' }} />
            )}
            <span style={{ fontSize: '14pt', fontWeight: 700 }}>{letterhead.displayName}</span>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: MUTED, lineHeight: 1.35 }}>
            <div>{letterhead.legalName}</div>
            <div>IČO {letterhead.ico}</div>
            <div>{letterhead.address}</div>
          </div>
        </header>
        <main>
          <h1 style={{ fontSize: '18pt', marginBottom: '14pt' }}>{title}</h1>
          {children}
        </main>
      </body>
    </html>
  );
}

/**
 * One fact as "label: value". Templates state camp data this way, after a label, so a name never has to
 * be declined to fit a Czech sentence.
 */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '6pt', padding: '3pt 0', borderBottom: `0.5pt solid ${RULE}` }}>
      <span style={{ flex: '0 0 40mm', color: MUTED }}>{label}:</span>
      <span>{children}</span>
    </div>
  );
}
