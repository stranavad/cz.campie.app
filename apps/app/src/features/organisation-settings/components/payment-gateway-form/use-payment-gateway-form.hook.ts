import { useState } from 'react';

import { setPaymentGatewayKeysBodySchema } from '@repo/schema/organisations';

import { useAppForm } from '@/core/form';
import {
  usePaymentGatewayQuery,
  useRemovePaymentGatewayKeysMutation,
  useSetPaymentGatewayKeysMutation,
} from '@/features/organisation-settings/api/organisation-settings.queries';

// The Comgate keys: the secret is typed in and sent, never shown back, so the form always starts empty.
export function usePaymentGatewayForm(organisationId: string) {
  const current = usePaymentGatewayQuery(organisationId);
  const save = useSetPaymentGatewayKeysMutation(organisationId);
  const remove = useRemovePaymentGatewayKeysMutation(organisationId);
  const [status, setStatus] = useState<'saved' | 'removed' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: { merchantId: '', secret: '' },
    validators: { onChange: setPaymentGatewayKeysBodySchema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        await save.mutateAsync(setPaymentGatewayKeysBodySchema.parse(value));
        formApi.reset();
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return {
    form,
    status,
    merchantId: current.data?.merchantId ?? null,
    isLoading: current.isPending,
    isRemoving: remove.isPending,
    removeKeys: () => {
      setStatus(null);
      remove.mutate(undefined, {
        onSuccess: () => setStatus('removed'),
        onError: () => setStatus('failed'),
      });
    },
  };
}
