import { createContext, Fragment, use, type ReactNode } from 'react';

import { fillPlaceholders } from '@repo/schema/emails';
import { brandColours } from '@repo/schema/organisations';

// Who an email comes from, as its frame shows it: the Camp's name and contact, the accent colour, and the
// product that delivers it. Every template gets it from the pipeline, so no template names a Camp or an
// address by itself. The platform's own mail has no contact to reply to.
export interface EmailBrand {
  readonly name: string;
  readonly contact: string | null;
  readonly accentColour: string;
  readonly productName: string;
}

// Layout and font are fixed by the platform; only the brand varies. Email clients ignore most style
// sheets, so every style is inline and the structure is tables. The dark theme is the one exception: a
// client that follows the system's dark mode applies the classes' overrides from the head.
export const EMAIL_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const EMAIL_MONO = 'ui-monospace, Menlo, Consolas, monospace';

export const EMAIL_COLOURS = {
  page: '#f4f4f2',
  card: '#ffffff',
  ink: '#1c1917',
  body: '#44403c',
  muted: '#57534e',
  line: '#e7e5e4',
  noteBackground: '#fef3c7',
  noteText: '#78350f',
} as const;

const DARK = {
  page: '#0f0e0d',
  card: '#1c1a18',
  ink: '#f5f1ea',
  body: '#d6d0c8',
  muted: '#ada59b',
  line: '#2f2b27',
  noteBackground: '#3a2a0a',
  noteText: '#fcd34d',
} as const;

// The classes the dark theme overrides; an element takes the one of the colour it shows.
export const EMAIL_CLASS = {
  page: 'e-page',
  card: 'e-card',
  ink: 'e-ink',
  body: 'e-body',
  muted: 'e-muted',
  line: 'e-line',
  frame: 'e-frame',
  accent: 'e-accent',
  badge: 'e-badge',
  button: 'e-button',
  note: 'e-note',
  noteText: 'e-note-text',
} as const;

/**
 * The dark theme's overrides. The colours are the platform's and the accent is a validated hex, so nothing an
 * admin wrote reaches the style sheet.
 * @param accentColour the brand's accent colour
 */
function darkTheme(accentColour: string): string {
  const { darkAccent, onDarkAccent } = brandColours(accentColour);
  const rules: Record<keyof typeof EMAIL_CLASS, string> = {
    page: `background-color:${DARK.page}!important`,
    card: `background-color:${DARK.card}!important`,
    ink: `color:${DARK.ink}!important`,
    body: `color:${DARK.body}!important`,
    muted: `color:${DARK.muted}!important`,
    line: `border-color:${DARK.line}!important`,
    frame: `border-color:${DARK.ink}!important`,
    accent: `background-color:${darkAccent}!important;color:${onDarkAccent}!important`,
    badge: `background-color:${onDarkAccent}!important;color:${darkAccent}!important`,
    button: `background-color:${DARK.ink}!important;color:${EMAIL_COLOURS.ink}!important`,
    note: `background-color:${DARK.noteBackground}!important`,
    noteText: `color:${DARK.noteText}!important`,
  };
  const body = Object.entries(rules)
    .map(([key, rule]) => `.${EMAIL_CLASS[key as keyof typeof EMAIL_CLASS]}{${rule}}`)
    .join('');

  return `:root{color-scheme:light dark;supported-color-schemes:light dark}@media (prefers-color-scheme:dark){${body}}`;
}

// The brand of the email being rendered, so the parts a template places (the steps) wear it too.
const BrandContext = createContext<EmailBrand | null>(null);

const presentation = { role: 'presentation', width: '100%', cellPadding: 0, cellSpacing: 0, border: 0 } as const;

export const EMAIL_PARAGRAPH = {
  margin: '0 0 14px',
  fontFamily: EMAIL_FONT,
  fontSize: '16px',
  lineHeight: '26px',
  color: EMAIL_COLOURS.body,
} as const;

// A fact of the platform's own mail, its label in bold: one per paragraph, so the plain text reads alike.
export const EMAIL_FACT = { ...EMAIL_PARAGRAPH, margin: '0 0 6px', fontSize: '15px', lineHeight: '23px' } as const;

/**
 * The frame of every email: a header in the accent colour with the Camp's initial, name and the title, the
 * template's content on a card, and below it who sent the email and the Camp's contact.
 */
export function EmailLayout({
  brand,
  title,
  preview,
  children,
}: {
  brand: EmailBrand;
  title: string;
  // The line inbox lists show next to the subject.
  preview: string;
  children: ReactNode;
}) {
  const { accent, onAccent } = brandColours(brand.accentColour);
  const footer = {
    margin: 0,
    fontFamily: EMAIL_FONT,
    fontSize: '13px',
    lineHeight: '20px',
    color: EMAIL_COLOURS.muted,
  };

  return (
    <html lang="cs">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: darkTheme(brand.accentColour) }} />
      </head>
      <body className={EMAIL_CLASS.page} style={{ margin: 0, padding: 0, backgroundColor: EMAIL_COLOURS.page }}>
        <BrandContext value={brand}>
          <div data-skip-in-text="true" style={{ display: 'none', overflow: 'hidden', maxHeight: 0, opacity: 0 }}>
            {preview}
          </div>
          <table {...presentation} className={EMAIL_CLASS.page} style={{ backgroundColor: EMAIL_COLOURS.page }}>
            <tbody>
              <tr>
                <td align="center" style={{ padding: '40px 12px' }}>
                  <table
                    {...presentation}
                    className={EMAIL_CLASS.card}
                    style={{
                      maxWidth: '600px',
                      backgroundColor: EMAIL_COLOURS.card,
                      borderRadius: '18px',
                      borderCollapse: 'separate',
                      overflow: 'hidden',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          className={EMAIL_CLASS.accent}
                          style={{ padding: '32px 40px 30px', backgroundColor: accent, color: onAccent }}
                        >
                          <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                            <tbody>
                              <tr>
                                <td
                                  className={EMAIL_CLASS.badge}
                                  data-skip-in-text="true"
                                  align="center"
                                  width={44}
                                  height={44}
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    backgroundColor: onAccent,
                                    color: accent,
                                    fontFamily: EMAIL_FONT,
                                    fontSize: '20px',
                                    fontWeight: 800,
                                  }}
                                >
                                  {initialOf(brand.name)}
                                </td>
                                <td
                                  style={{
                                    paddingLeft: '12px',
                                    fontFamily: EMAIL_FONT,
                                    fontSize: '17px',
                                    fontWeight: 700,
                                    color: 'inherit',
                                  }}
                                >
                                  {brand.name}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <h1
                            style={{
                              margin: '22px 0 0',
                              fontFamily: EMAIL_FONT,
                              fontSize: '30px',
                              fontWeight: 800,
                              letterSpacing: '-0.02em',
                              lineHeight: '36px',
                              color: 'inherit',
                            }}
                          >
                            {title}
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '30px 40px 22px' }}>{children}</td>
                      </tr>
                      <tr>
                        <td
                          className={EMAIL_CLASS.line}
                          align="center"
                          style={{ padding: '22px 40px 28px', borderTop: `1px solid ${EMAIL_COLOURS.line}` }}
                        >
                          {brand.contact === null ? (
                            <p className={EMAIL_CLASS.muted} style={footer}>
                              Tento e-mail vám poslal {brand.productName}.
                            </p>
                          ) : (
                            <>
                              <p className={EMAIL_CLASS.muted} style={footer}>
                                Tento e-mail vám poslal {brand.name}. Odpovědí na něj napíšete přímo pořadateli.
                              </p>
                              <p className={EMAIL_CLASS.muted} style={footer}>
                                Kontakt:{' '}
                                <a
                                  className={EMAIL_CLASS.muted}
                                  href={`mailto:${brand.contact}`}
                                  style={{ color: EMAIL_COLOURS.muted }}
                                >
                                  {brand.contact}
                                </a>
                              </p>
                              <p className={EMAIL_CLASS.muted} style={{ ...footer, marginTop: '6px' }}>
                                Přihlášky zajišťuje {brand.productName}
                              </p>
                            </>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </BrandContext>
      </body>
    </html>
  );
}

/**
 * The first letter of a name, standing in for a logo in the header.
 * @param name the Camp's or the product's name
 */
function initialOf(name: string): string {
  const [first] = new Intl.Segmenter('cs').segment(name.trim());

  return first?.segment.toLocaleUpperCase('cs') ?? '';
}

/**
 * A text an admin wrote, with its placeholders filled: a blank line starts a paragraph, a line break
 * stays one. Values are filled in after the text is split and inserted as text, so they add neither
 * paragraphs nor markup.
 */
export function EmailText({ text, values }: { text: string; values: Readonly<Record<string, string>> }) {
  const paragraphs = text
    .replaceAll('\r\n', '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block !== '');

  return paragraphs.map((block, index) => (
    // The text is replaced as a whole, never reordered, so the position is a stable key.
    <p key={index} className={EMAIL_CLASS.body} style={EMAIL_PARAGRAPH}>
      {block.split('\n').map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex === 0 ? null : <br />}
          {fillPlaceholders(line, values)}
        </Fragment>
      ))}
    </p>
  ));
}

/**
 * The email's call to action: a full-width button with its link, fixed by the platform, and the link
 * written out below it for a client that does not show the button.
 */
export function EmailAction({ href, label }: { href: string; label: string }) {
  return (
    <div style={{ margin: '8px 0 22px' }}>
      <table {...presentation}>
        <tbody>
          <tr>
            <td
              className={EMAIL_CLASS.button}
              align="center"
              style={{ backgroundColor: EMAIL_COLOURS.ink, borderRadius: '10px' }}
            >
              <a
                className={EMAIL_CLASS.button}
                href={href}
                style={{
                  display: 'block',
                  padding: '15px 24px',
                  fontFamily: EMAIL_FONT,
                  fontSize: '16px',
                  lineHeight: '22px',
                  fontWeight: 600,
                  color: EMAIL_COLOURS.card,
                  textDecoration: 'none',
                }}
              >
                {label}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <p
        data-skip-in-text="true"
        className={EMAIL_CLASS.muted}
        style={{
          ...EMAIL_PARAGRAPH,
          margin: '14px 0 0',
          fontSize: '13px',
          lineHeight: '21px',
          color: EMAIL_COLOURS.muted,
        }}
      >
        Tlačítko nefunguje? Otevřete tento odkaz:
        <br />
        <a className={EMAIL_CLASS.ink} href={href} style={{ color: EMAIL_COLOURS.ink, wordBreak: 'break-all' }}>
          {href}
        </a>
      </p>
    </div>
  );
}

/**
 * A heading over numbered steps, each number on the brand's accent colour, such as what a child still has
 * open.
 */
export function EmailSteps({ title, steps }: { title: string; steps: readonly string[] }) {
  const brand = use(BrandContext);
  const { accent, onAccent } = brandColours(brand?.accentColour ?? EMAIL_COLOURS.ink);

  return (
    <div style={{ margin: '0 0 22px' }}>
      <p
        className={EMAIL_CLASS.ink}
        style={{ ...EMAIL_PARAGRAPH, margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: EMAIL_COLOURS.ink }}
      >
        {title}
      </p>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
        <tbody>
          {steps.map((step, index) => (
            // The steps are listed as given, never reordered, so the position is a stable key.
            <tr key={index}>
              <td style={{ padding: '4px 12px 4px 0', verticalAlign: 'top' }}>
                <div
                  className={EMAIL_CLASS.accent}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '999px',
                    backgroundColor: accent,
                    color: onAccent,
                    fontFamily: EMAIL_FONT,
                    fontSize: '13px',
                    lineHeight: '24px',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {index + 1}
                </div>
              </td>
              <td
                className={EMAIL_CLASS.ink}
                style={{
                  padding: '4px 0',
                  fontFamily: EMAIL_FONT,
                  fontSize: '15px',
                  lineHeight: '24px',
                  color: EMAIL_COLOURS.ink,
                }}
              >
                {step}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A label's separator that only the plain text version shows, where a table's cells would otherwise run
 * together ("Číslo účtu: 123456789/0100").
 */
export function EmailTextSeparator() {
  return <span style={{ display: 'none', fontSize: 0, maxHeight: 0, overflow: 'hidden' }}>: </span>;
}
