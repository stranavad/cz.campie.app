import { useEffect, useRef, useState } from 'react';

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
  // The form, to find its inputs by name, and the one last typed in; the text until either is.
  const formRef = useRef<HTMLFormElement>(null);
  const target = useRef<'subject' | 'text'>('text');

  // Remembers which of the two inputs a placeholder would go into, as the cursor moves between them.
  useEffect(() => {
    const element = formRef.current;
    const remember = ({ target: focused }: FocusEvent) => {
      if (
        (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) &&
        (focused.name === 'subject' || focused.name === 'text')
      ) {
        target.current = focused.name;
      }
    };

    element?.addEventListener('focusin', remember);

    return () => element?.removeEventListener('focusin', remember);
  }, []);

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
    formRef,
    status,
    // Puts a placeholder where the cursor was, or over the selection, and the cursor after it.
    insert: (placeholder: string) => {
      const name = target.current;
      const input = formRef.current?.elements.namedItem(name);

      if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
        return;
      }

      const value = form.getFieldValue(name);
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? start;
      const caret = start + placeholder.length;

      form.setFieldValue(name, value.slice(0, start) + placeholder + value.slice(end));
      // After React has written the new value into the input.
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(caret, caret);
      });
    },
    // As they are written into the subject or text.
    placeholders: email.placeholders.map((name) => `{{${name}}}`),
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
