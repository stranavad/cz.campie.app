import { useState } from 'react';

import type { GuardianRegistration } from '@repo/schema/portal';
import { INVOICE_REQUEST_ERROR_CODES, type InvoiceRequestErrorCode } from '@repo/schema/registrations';

import { useAppForm } from '@/core/form';
import {
  invoiceRequestBodyOf,
  invoiceRequestFormOptions,
  invoiceRequestFormSchema,
  invoiceRequestFormValues,
} from '@/core/invoice-request';
import { useRemoveInvoiceRequestMutation, useSaveInvoiceRequestMutation } from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';

/**
 * Name why a change of the Invoice request failed, as the portal translates it.
 * @param error what it failed with
 */
function failureOf(error: Error | null): InvoiceRequestErrorCode | 'unexpected' | null {
  if (error === null) {
    return null;
  }

  const code = error instanceof HttpError ? error.code : undefined;

  return INVOICE_REQUEST_ERROR_CODES.find((known) => known === code) ?? 'unexpected';
}

/**
 * A Registration's Invoice request in the portal: shown, and while the camp has not invoiced it, added,
 * changed or removed by the guardian.
 * @param registration the guardian's Registration
 */
export function useInvoiceRequestCard(registration: GuardianRegistration) {
  const { invoiceRequest, total } = registration;
  const [isEditing, setEditing] = useState(false);
  const save = useSaveInvoiceRequestMutation(registration.id);
  const remove = useRemoveInvoiceRequestMutation(registration.id);
  const form = useAppForm({
    ...invoiceRequestFormOptions,
    defaultValues: invoiceRequestFormValues(invoiceRequest, total),
    validators: { onSubmit: invoiceRequestFormSchema(total) },
    onSubmit: async ({ value }) => {
      const body = invoiceRequestBodyOf(value, total);

      if (body !== null) {
        await save.mutateAsync(body, { onSuccess: () => setEditing(false) });
      }
    },
  });
  // An uploaded invoice keeps it the camp's even when it cleared the date.
  const isInvoiced =
    invoiceRequest !== null && (invoiceRequest.invoicedOn !== null || registration.invoiceFiles.length > 0);

  return {
    invoiceRequest,
    form,
    // Nothing to show while the Camp offers none and the guardian asked for none.
    isShown: registration.camp.invoiceRequests || invoiceRequest !== null,
    isInvoiced,
    isEditing,
    // A new one only while the Camp offers it; an existing one stays changeable.
    canEdit: !isInvoiced && (registration.camp.invoiceRequests || invoiceRequest !== null),
    canRemove: invoiceRequest !== null && !isInvoiced,
    isRemoving: remove.isPending,
    failure: failureOf(save.error ?? remove.error),
    edit: () => {
      save.reset();
      remove.reset();
      form.reset(invoiceRequestFormValues(invoiceRequest, total));
      setEditing(true);
    },
    cancel: () => setEditing(false),
    remove: () => remove.mutate(),
  };
}
