import { describe, expect, it } from 'vitest';

import type { ConsentItem } from '../consent/consent.resource.ts';
import { checkConsentAnswers } from './consent-answers.ts';

const INFO = '0190a2b4-0000-7000-8000-000000000001';
const AGREE = '0190a2b4-0000-7000-8000-000000000002';
const PHOTOS = '0190a2b4-0000-7000-8000-000000000003';

const ITEMS: ConsentItem[] = [
  { id: INFO, kind: 'information', text: 'Tábor pořádá spolek.' },
  { id: AGREE, kind: 'must_agree', text: 'Souhlasím s táborovým řádem.' },
  { id: PHOTOS, kind: 'yes_no', text: 'Souhlasím s fotografováním.' },
];

describe('checkConsentAnswers', () => {
  it('takes agreement to a must-agree item and either answer to a yes/no one', () => {
    expect(checkConsentAnswers(ITEMS, { [AGREE]: true, [PHOTOS]: false })).toEqual([]);
    expect(checkConsentAnswers(ITEMS, { [AGREE]: true, [PHOTOS]: true })).toEqual([]);
  });

  it('refuses a must-agree item refused, and a missing answer', () => {
    expect(checkConsentAnswers(ITEMS, { [AGREE]: false })).toEqual([
      { itemId: AGREE, code: 'consent_agreement_required' },
      { itemId: PHOTOS, code: 'consent_answer_missing' },
    ]);
  });

  it('refuses an answer to an information item or to no item of the version', () => {
    const unknown = '0190a2b4-0000-7000-8000-000000000009';

    expect(checkConsentAnswers(ITEMS, { [INFO]: true, [AGREE]: true, [PHOTOS]: true, [unknown]: true })).toEqual([
      { itemId: INFO, code: 'consent_answer_unexpected' },
      { itemId: unknown, code: 'consent_answer_unexpected' },
    ]);
  });
});
