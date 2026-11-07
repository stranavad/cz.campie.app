// The emails a Camp sends, each with the placeholders its text may use. The login link cannot be
// switched off: guardians could not reach the portal without it.
export const EMAIL_TYPES = [
  'registration_confirmation',
  'login_link',
  'payment_received',
  'payment_reminder',
  'consent_copy',
  'open_items_reminder',
  'document_returned',
  'cancellation',
  'new_registration_notification',
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

// What placeholders stand for: the children's names, the Turnus, the amount due now with its due date,
// the Variable symbol, the Camp and its contact.
export const EMAIL_PLACEHOLDERS = [
  'deti',
  'turnus',
  'castka',
  'splatnost',
  'variabilni_symbol',
  'tabor',
  'kontakt',
] as const;

export type EmailPlaceholder = (typeof EMAIL_PLACEHOLDERS)[number];

export interface EmailTypeSpec {
  // Login links on the auth stream, everything else on notification.
  readonly stream: 'auth' | 'notification';
  // Guardians, or the Camp's team (its notification recipients).
  readonly audience: 'guardians' | 'camp';
  readonly canSwitchOff: boolean;
  readonly placeholders: readonly EmailPlaceholder[];
  readonly subject: string;
  readonly text: string;
}

const COMMON: readonly EmailPlaceholder[] = ['tabor', 'kontakt'];

// Each type's defaults, the platform's Czech wording until a Camp writes its own.
export const EMAIL_TYPE_SPECS: Readonly<Record<EmailType, EmailTypeSpec>> = {
  registration_confirmation: {
    stream: 'notification',
    audience: 'guardians',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus', 'castka', 'splatnost', 'variabilni_symbol'],
    subject: 'Potvrzení přihlášky na {{tabor}}',
    text: 'Dobrý den,\n\nděkujeme za přihlášku. Na turnus {{turnus}} jsme přihlásili: {{deti}}.\n\nPřihlášku najdete v příloze. Prosíme o úhradu {{castka}} do {{splatnost}} s variabilním symbolem {{variabilni_symbol}}.\n\nS pozdravem\n{{tabor}}',
  },
  login_link: {
    stream: 'auth',
    audience: 'guardians',
    canSwitchOff: false,
    placeholders: COMMON,
    subject: 'Přihlášení do portálu {{tabor}}',
    text: 'Dobrý den,\n\npro přihlášení do portálu klikněte na tlačítko níže. Odkaz platí 30 minut.\n\nPokud jste o přihlášení nežádali, e-mail můžete ignorovat.',
  },
  payment_received: {
    stream: 'notification',
    audience: 'guardians',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus', 'castka', 'splatnost', 'variabilni_symbol'],
    subject: 'Přijali jsme platbu za {{deti}}',
    text: 'Dobrý den,\n\nděkujeme, platbu za přihlášku s variabilním symbolem {{variabilni_symbol}} jsme přijali.\n\nS pozdravem\n{{tabor}}',
  },
  payment_reminder: {
    stream: 'notification',
    audience: 'guardians',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus', 'castka', 'splatnost', 'variabilni_symbol'],
    subject: 'Připomínka platby za {{deti}}',
    text: 'Dobrý den,\n\nzatím jsme neobdrželi platbu {{castka}} splatnou {{splatnost}}. Prosíme o úhradu s variabilním symbolem {{variabilni_symbol}}.\n\nS pozdravem\n{{tabor}}',
  },
  consent_copy: {
    stream: 'notification',
    audience: 'guardians',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus'],
    subject: 'Kopie podepsaného souhlasu',
    text: 'Dobrý den,\n\nv příloze posíláme kopii souhlasu, který jste podepsali za {{deti}}.\n\nS pozdravem\n{{tabor}}',
  },
  open_items_reminder: {
    stream: 'notification',
    audience: 'guardians',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus'],
    subject: 'Ještě nám chybí několik věcí k přihlášce',
    text: 'Dobrý den,\n\nk přihlášce {{deti}} na turnus {{turnus}} nám ještě něco chybí. Podrobnosti najdete v portálu.\n\nS pozdravem\n{{tabor}}',
  },
  document_returned: {
    stream: 'notification',
    audience: 'guardians',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus'],
    subject: 'Dokument je potřeba nahrát znovu',
    text: 'Dobrý den,\n\ndokument, který jste nahráli za {{deti}}, je potřeba nahrát znovu. Důvod najdete v portálu.\n\nS pozdravem\n{{tabor}}',
  },
  cancellation: {
    stream: 'notification',
    audience: 'guardians',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus'],
    subject: 'Zrušení přihlášky',
    text: 'Dobrý den,\n\npřihláška {{deti}} na turnus {{turnus}} byla zrušena. Máte-li dotazy, napište nám na {{kontakt}}.\n\nS pozdravem\n{{tabor}}',
  },
  new_registration_notification: {
    stream: 'notification',
    audience: 'camp',
    canSwitchOff: true,
    placeholders: [...COMMON, 'deti', 'turnus', 'variabilni_symbol'],
    subject: 'Nová přihláška na {{turnus}}',
    text: 'Na turnus {{turnus}} přišla nová přihláška: {{deti}}, variabilní symbol {{variabilni_symbol}}.',
  },
};

// What the preview fills placeholders with: an obviously made-up Registration.
export const SAMPLE_PLACEHOLDER_VALUES: Readonly<Record<EmailPlaceholder, string>> = {
  deti: 'Ema Testovací, Jan Testovací',
  turnus: 'Turnus 1 (4. 7. - 17. 7.)',
  castka: '13 000 Kč',
  splatnost: '24. 4. 2027',
  variabilni_symbol: '27123456',
  tabor: 'Letní tábor',
  kontakt: 'tabor@example.com',
};
