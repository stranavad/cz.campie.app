import { useState } from 'react';

import type { CampEmailText } from '@repo/schema/emails';

import { useAppForm } from '@/core/form';
import { usePreviewEmailTextMutation, useSaveEmailTextMutation } from '@/features/camps/api/camps.queries';
import {
  emailTextFormSchema,
  emailTextFormValues,
} from '@/features/camps/components/email-texts-section/email-text-form.schema';

export function useEmailTextForm(organisationId: string, campId: string, email: CampEmailText) {
  const save = useSaveEmailTextMutation(organisationId, campId, email.type);
  const preview = usePreviewEmailTextMutation(organisationId, campId, email.type);
  const schema = emailTextFormSchema(email.placeholders);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: emailTextFormValues(email),
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        formApi.reset(emailTextFormValues(await save.mutateAsync(schema.parse(value))));
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return {
    form,
    status,
    preview: preview.data ?? null,
    showPreview: () => {
      const { subject, text } = form.state.values;
      setStatus(null);
      preview.mutate({ subject, text }, { onError: () => setStatus('failed') });
    },
    reset: () =>
      save.mutate(null, {
        onSuccess: (defaults) => {
          form.reset(emailTextFormValues(defaults));
          setStatus('saved');
        },
        onError: () => setStatus('failed'),
      }),
  };
}
