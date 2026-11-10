import { useState } from 'react';

import {
  INVOICE_REQUEST_ERROR_CODES,
  type AdminInvoiceRequestBody,
  type InvoiceRequestErrorCode,
  type RegistrationDetail,
} from '@repo/schema/registrations';
import { pragueDateOf } from '@repo/schema/shared';

import { useAppForm } from '@/core/form';
import { invoiceRequestFormOptions, invoiceRequestFormValues } from '@/core/invoice-request';
import {
  useRemoveInvoiceRequestMutation,
  useSaveInvoiceRequestMutation,
  useUploadInvoiceFileMutation,
} from '@/features/participants/api/participants.queries';
import {
  adminBillingFormSchema,
  billingBodyOf,
  invoiceStateFormSchema,
  stateBodyOf,
  stateFormValues,
} from '@/features/participants/components/registration-detail/invoice-request-form.schema';
import { HttpError } from '@/lib/api';

/**
 * Name why a change of the Invoice request failed, as the detail translates it.
 * @param error what it failed with
 */
function failureOf(error: Error | null): InvoiceRequestErrorCode | 'file_type_not_allowed' | 'unexpected' | null {
  if (error === null) {
    return null;
  }

  const code = error instanceof HttpError ? error.code : undefined;

  if (code === 'file_type_not_allowed') {
    return code;
  }

  return INVOICE_REQUEST_ERROR_CODES.find((known) => known === code) ?? 'unexpected';
}

/**
 * A Registration's Invoice request in the admin detail: shown, and with Registrations write added, changed,
 * marked invoiced, given its invoices, and removed while it has none.
 * @param organisationId the Organisation
 * @param detail the Registration
 */
export function useInvoiceRequestCard(organisationId: string, detail: RegistrationDetail) {
  const { invoiceRequest, invoiceFiles, ledger } = detail;
  const [editing, setEditing] = useState<'billing' | 'state' | null>(null);
  const [today] = useState(() => pragueDateOf(new Date()));
  const save = useSaveInvoiceRequestMutation(organisationId, detail.id);
  const remove = useRemoveInvoiceRequestMutation(organisationId, detail.id);
  const upload = useUploadInvoiceFileMutation(organisationId, detail.id);
  const submit = async (body: AdminInvoiceRequestBody | null) => {
    if (body !== null) {
      await save.mutateAsync(body, { onSuccess: () => setEditing(null) });
    }
  };
  const form = useAppForm({
    ...invoiceRequestFormOptions,
    defaultValues: invoiceRequestFormValues(invoiceRequest, ledger.total),
    validators: { onSubmit: adminBillingFormSchema },
    onSubmit: ({ value }) =>
      submit(
        billingBodyOf(value, {
          invoicedOn: invoiceRequest?.invoicedOn ?? null,
          invoiceNumber: invoiceRequest?.invoiceNumber ?? null,
        }),
      ),
  });
  const stateForm = useAppForm({
    defaultValues: stateFormValues(invoiceRequest, today),
    validators: { onSubmit: invoiceStateFormSchema },
    onSubmit: ({ value }) => submit(invoiceRequest === null ? null : stateBodyOf(value, invoiceRequest)),
  });
  const reset = () => {
    save.reset();
    remove.reset();
    upload.reset();
  };

  return {
    invoiceRequest,
    invoiceFiles,
    company: ledger.company,
    form,
    stateForm,
    editing,
    // Invoice files are never removed, so neither is an Invoice request holding one.
    canRemove: invoiceRequest !== null && invoiceFiles.length === 0,
    isBusy: remove.isPending || upload.isPending,
    failure: failureOf(save.error ?? remove.error ?? upload.error),
    editBilling: () => {
      reset();
      form.reset(invoiceRequestFormValues(invoiceRequest, ledger.total));
      setEditing('billing');
    },
    editState: () => {
      reset();
      stateForm.reset(stateFormValues(invoiceRequest, today));
      setEditing('state');
    },
    cancel: () => setEditing(null),
    remove: () => {
      reset();
      remove.mutate();
    },
    upload: (file: File) => {
      reset();
      upload.mutate(file);
    },
  };
}
