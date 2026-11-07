import type { ReactNode } from 'react';

import { EmailAction, EmailLayout, EmailText } from '../../../core/emails/email-layout.tsx';
import { defineEmail, type EmailTemplate } from '../../../core/emails/email.service.ts';

export interface CampEmailProps {
  readonly subject: string;
  readonly text: string;
  readonly values: Readonly<Record<string, string>>;
  // The platform's fixed parts: the button's link (a login link), and the payment block with its QR code.
  readonly actionHref?: string;
  readonly payment?: ReactNode;
  // A platform-worded list below the text, such as what is still open per child.
  readonly details?: ReactNode;
}

// The button each stream's emails carry: a login link signs in.
const ACTION_LABELS = { auth: 'Přihlásit se', notification: 'Otevřít portál' } as const;

/**
 * Build the email a Camp sends of a type in its stream: the Camp's own or default subject and text, with
 * placeholders filled, around the platform's fixed parts.
 * @param stream the type's stream
 */
function campEmail(stream: 'auth' | 'notification'): EmailTemplate<CampEmailProps> {
  return defineEmail<CampEmailProps>({
    stream,
    subject: ({ subject }) => subject,
    render: ({ brand, subject, text, values, actionHref, payment, details }) => (
      <EmailLayout brand={brand} title={subject} preview={subject} payment={payment}>
        <EmailText text={text} values={values} />
        {details}
        {actionHref === undefined ? null : <EmailAction href={actionHref} label={ACTION_LABELS[stream]} />}
      </EmailLayout>
    ),
  });
}

export const CAMP_EMAILS = { auth: campEmail('auth'), notification: campEmail('notification') };
