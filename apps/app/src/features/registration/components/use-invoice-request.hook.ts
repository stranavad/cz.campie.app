import { useSelector } from '@tanstack/react-form';
import { useState } from 'react';

import type { InvoiceRequestBody } from '@repo/schema/registrations';

import { useAppForm } from '@/core/form';
import { invoiceRequestBodyOf, invoiceRequestFormOptions, invoiceRequestFormSchema } from '@/core/invoice-request';

/**
 * The Invoice request a guardian may add on the form while the Camp offers one: the company's details and
 * the amount, which starts at the live total.
 * @param total the live total, once priced
 * @param onEdit called on every change, so a refusal of the last submission goes stale
 */
export function useInvoiceRequest(total: number | undefined, onEdit: () => void) {
  const [wanted, setWanted] = useState(false);
  const limit = total ?? Number.MAX_SAFE_INTEGER;
  const form = useAppForm({
    ...invoiceRequestFormOptions,
    validators: { onSubmit: invoiceRequestFormSchema(limit) },
    listeners: { onChange: onEdit },
  });

  const amount = useSelector(form.store, (state) => state.values.amount);

  return {
    form,
    wanted,
    // The company pays everything, so no Deposit is offered.
    coversTotal: wanted && total !== undefined && Number(amount.replaceAll(/\s/g, '')) >= total,
    setWanted: (next: boolean) => {
      onEdit();
      setWanted(next);

      if (next && total !== undefined) {
        form.setFieldValue('amount', String(total));
      }
    },
    /**
     * Check the Invoice request before sending, showing what is wrong at its fields.
     * @returns the Invoice request, null without one, or undefined when it does not check out
     */
    checked: async (): Promise<InvoiceRequestBody | null | undefined> => {
      if (!wanted) {
        return null;
      }

      await form.handleSubmit();

      return invoiceRequestBodyOf(form.state.values, limit) ?? undefined;
    },
  };
}

export type InvoiceRequestState = ReturnType<typeof useInvoiceRequest>;
