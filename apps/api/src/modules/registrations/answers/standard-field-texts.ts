import { isRegistrationFieldKey, type RegistrationFieldKey } from '@repo/schema/camps';
import { chosenOption, type AnswerValue, type FormField } from '@repo/schema/form-engine';

// The standard fields' labels and the platform's options as documents and exports print them, in Czech;
// the app has the same texts in its translations, under the catalogue's i18n keys, and a test keeps them equal.
export const STANDARD_FIELD_TEXTS: Readonly<
  Record<RegistrationFieldKey, { label: string; options?: Readonly<Record<string, string>> }>
> = {
  gender: { label: 'Pohlaví', options: { boy: 'Chlapec', girl: 'Dívka' } },
  birthNumber: { label: 'Rodné číslo' },
  insurer: {
    label: 'Zdravotní pojišťovna',
    options: {
      '111': '111 - Všeobecná zdravotní pojišťovna České republiky',
      '201': '201 - Vojenská zdravotní pojišťovna České republiky',
      '205': '205 - Česká průmyslová zdravotní pojišťovna',
      '207': '207 - Oborová zdravotní pojišťovna zaměstnanců bank, pojišťoven a stavebnictví',
      '209': '209 - Zaměstnanecká pojišťovna Škoda',
      '211': '211 - Zdravotní pojišťovna ministerstva vnitra České republiky',
      '213': '213 - RBP, zdravotní pojišťovna',
    },
  },
  participantAddress: { label: 'Adresa dítěte' },
  tshirtSize: {
    label: 'Velikost trička',
    options: {
      '116': '116',
      '128': '128',
      '140': '140',
      '152': '152',
      '164': '164',
      xs: 'XS',
      s: 'S',
      m: 'M',
      l: 'L',
      xl: 'XL',
      xxl: 'XXL',
    },
  },
  healthNote: { label: 'Zdravotní stav, alergie a léky' },
  campFriend: { label: 'Kamarád do oddílu' },
  guardianAddress: { label: 'Adresa zákonného zástupce' },
  transport: { label: 'Doprava na tábor', options: { own: 'Vlastní doprava' } },
  howDidYouHear: {
    label: 'Jak jste se o nás dozvěděli',
    options: {
      friends: 'Od známých nebo kamarádů',
      returning: 'Jezdíme už dříve',
      internet: 'Internet',
      social: 'Sociální sítě',
      school: 'Škola nebo kroužek',
      print: 'Leták nebo plakát',
      other: 'Jinak',
    },
  },
};

/**
 * Name a standard field in Czech, or give back the key of one the platform no longer knows.
 * @param key the field's key
 */
export function standardLabel(key: string): string {
  return isRegistrationFieldKey(key) ? STANDARD_FIELD_TEXTS[key].label : key;
}

/**
 * Write a standard field's answer in Czech: a chosen option by its name, anything else as it is.
 * @param field the field as its form asked it
 * @param value the answer
 */
export function standardAnswerText(field: FormField, value: AnswerValue): AnswerValue {
  const option = chosenOption(field, value);

  if (option === null) {
    return value;
  }

  return (
    option.label ??
    (isRegistrationFieldKey(field.key) ? STANDARD_FIELD_TEXTS[field.key].options?.[option.value] : undefined) ??
    value
  );
}
