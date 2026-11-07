import { createContext, Fragment, use, type ReactNode } from 'react';

import { fillPlaceholders } from '@repo/schema/emails';
import { brandColours } from '@repo/schema/organisations';

// Who an email comes from, as its frame shows it: the Camp's name and contact, and the accent colour.
// Every template gets it from the pipeline, so no template names a Camp or an address by itself. The
// platform's own mail has no contact to reply to.
export interface EmailBrand {
  readonly name: string;
  readonly contact: string | null;
  readonly accentColour: string;
}

// Layout and font are fixed by the platform; only the brand varies. Email clients ignore most style
// sheets, so every style is inline and the structure is tables.
const PAGE = '#f2f2f2';
const CARD = '#ffffff';
const TEXT = '#1a1a1a';
const MUTED = '#555555';
const RULE = '#e5e5e5';
const FONT = 'Arial, Helvetica, sans-serif';

// The brand of the email being rendered, so the parts a template places (the button) wear it too.
const BrandContext = createContext<EmailBrand | null>(null);

const presentation = { role: 'presentation', width: '100%', cellPadding: 0, cellSpacing: 0, border: 0 } as const;

const paragraph = { margin: '0 0 14px', fontFamily: FONT, fontSize: '16px', lineHeight: '24px', color: TEXT };

/**
 * The frame of every email: the Camp's name over the accent colour, the title, the template's content,
 * the payment block in its fixed place, and the Camp's contact at the bottom.
 */
export function EmailLayout({
  brand,
  title,
  preview,
  payment,
  children,
}: {
  brand: EmailBrand;
  title: string;
  // The line inbox lists show next to the subject.
  preview: string;
  payment?: ReactNode;
  children: ReactNode;
}) {
  return (
    <html lang="cs">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: PAGE }}>
        <BrandContext value={brand}>
          <div data-skip-in-text="true" style={{ display: 'none', overflow: 'hidden', maxHeight: 0, opacity: 0 }}>
            {preview}
          </div>
          <table {...presentation} style={{ backgroundColor: PAGE }}>
            <tbody>
              <tr>
                <td align="center" style={{ padding: '32px 12px' }}>
                  <table {...presentation} style={{ maxWidth: '600px', backgroundColor: CARD }}>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            padding: '20px 32px',
                            borderBottom: `4px solid ${brand.accentColour}`,
                            fontFamily: FONT,
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: TEXT,
                          }}
                        >
                          {brand.name}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '28px 32px 14px' }}>
                          <h1 style={{ ...paragraph, margin: '0 0 20px', fontSize: '24px', lineHeight: '30px' }}>
                            {title}
                          </h1>
                          {children}
                        </td>
                      </tr>
                      {payment === undefined ? null : (
                        <tr>
                          <td style={{ padding: '0 32px 14px' }}>{payment}</td>
                        </tr>
                      )}
                      {brand.contact === null ? null : (
                        <tr>
                          <td
                            style={{
                              padding: '18px 32px',
                              borderTop: `1px solid ${RULE}`,
                              fontFamily: FONT,
                              fontSize: '13px',
                              lineHeight: '20px',
                              color: MUTED,
                            }}
                          >
                            <p style={{ margin: 0 }}>Odpovědí na tento e-mail napíšete pořadateli.</p>
                            <p style={{ margin: 0 }}>
                              Kontakt:{' '}
                              <a href={`mailto:${brand.contact}`} style={{ color: MUTED }}>
                                {brand.contact}
                              </a>
                            </p>
                          </td>
                        </tr>
                      )}
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
    <p key={index} style={paragraph}>
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
 * The email's call to action: a button with its link, fixed by the platform, in the brand's accent colour
 * with text that reads on it.
 */
export function EmailAction({ href, label }: { href: string; label: string }) {
  const brand = use(BrandContext);
  const { accent, onAccent } = brand === null ? { accent: TEXT, onAccent: CARD } : brandColours(brand.accentColour);

  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '8px 0 14px' }}>
      <tbody>
        <tr>
          <td style={{ backgroundColor: accent, borderRadius: '4px' }}>
            <a
              href={href}
              style={{
                display: 'block',
                padding: '14px 26px',
                fontFamily: FONT,
                fontSize: '16px',
                fontWeight: 'bold',
                color: onAccent,
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
