import { useState } from 'react';

import type { PreviewPriceBody, PublicTurnus } from '@repo/schema/camps';
import { pricedFieldIds, type Answers, type FormDefinition } from '@repo/schema/form-engine';

import { usePricePreviewQuery } from '@/features/registration/api/registration.queries';
import { useDebouncedValue } from '@/features/registration/hooks/use-debounced-value.hook';

/**
 * Keep only the answers that can change the price.
 * @param answers the answers
 * @param priced the fields that carry a surcharge
 */
function pricedAnswers(answers: Answers, priced: readonly string[]): Answers {
  return Object.fromEntries(Object.entries(answers).filter(([key]) => priced.includes(key)));
}

// The live price: only the answers that carry a surcharge are sent, debounced as one text key, so typing
// a name or a note asks nothing; the payment choice and the code that apply to it.
export function useLivePrice(
  slug: string,
  definition: FormDefinition | undefined,
  turnus: PublicTurnus | undefined,
  answers: { registration: Answers; participants: readonly Answers[] },
) {
  const [paymentChoice, setPaymentChoice] = useState<'full' | 'deposit'>('full');
  const [codeInput, setCodeInput] = useState('');
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const priced = definition === undefined ? [] : pricedFieldIds(definition);
  const key =
    turnus === undefined
      ? ''
      : JSON.stringify({
          turnusId: turnus.id,
          submission: {
            registration: pricedAnswers(answers.registration, priced),
            participants: answers.participants.map((participant) => pricedAnswers(participant, priced)),
          },
          paymentChoice,
          discountCode,
        });
  const settled = useDebouncedValue(key, 400);
  const price = usePricePreviewQuery(slug, settled === '' ? null : (JSON.parse(settled) as PreviewPriceBody));
  const current = price.isPlaceholderData || settled !== key ? undefined : price.data;
  const depositAvailable = price.data?.depositAvailable === true;

  return {
    price: price.data,
    isPriceStale: price.data !== undefined && current === undefined,
    isPriceFailing: price.isError,
    depositAvailable,
    // A choice of a Deposit the Turnus no longer offers falls back to paying in full.
    paymentChoice: depositAvailable ? paymentChoice : 'full',
    setPaymentChoice,
    codeInput,
    setCodeInput,
    applyCode: () => setDiscountCode(codeInput.trim() === '' ? null : codeInput.trim()),
    // What the typed code turned out to be, while it is the one applied.
    codeCheck: discountCode !== null && discountCode === codeInput.trim() ? (current?.discountCode ?? null) : null,
  };
}
