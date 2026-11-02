import { EmailAction, EmailLayout, EmailText } from '../core/emails/email-layout.tsx';
import { defineEmail } from '../core/emails/email.service.ts';

// The pipeline's samples, one per stream, until the first real emails join.

export const SampleLoginEmail = defineEmail<{ url: string }>({
  stream: 'auth',
  subject: () => 'Přihlášení do portálu',
  render: ({ brand, url }) => (
    <EmailLayout brand={brand} title="Přihlášení do portálu" preview="Odkaz pro přihlášení do portálu.">
      <EmailText text="Dobrý den, pro přihlášení klikněte na tlačítko níže." values={{}} />
      <EmailAction href={url} label="Přihlásit se" />
    </EmailLayout>
  ),
});

export const SampleNoticeEmail = defineEmail<{ text: string; values: Record<string, string> }>({
  stream: 'notification',
  subject: () => 'Ukázkové oznámení',
  render: ({ brand, text, values }) => (
    <EmailLayout
      brand={brand}
      title="Ukázkové oznámení"
      preview="Ukázka oznámení z tábora."
      payment={<p>Platební údaje</p>}
    >
      <EmailText text={text} values={values} />
    </EmailLayout>
  ),
});
