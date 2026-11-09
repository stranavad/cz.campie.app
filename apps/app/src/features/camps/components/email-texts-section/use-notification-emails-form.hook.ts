import { useState } from 'react';

import type { Camp } from '@repo/schema/camps';

import { useAppForm } from '@/core/form';
import { useUpdateCampMutation } from '@/features/camps/api/camps.queries';
import {
  notificationEmailsChangeOf,
  notificationEmailsFormSchema,
  notificationEmailsFormValues,
} from '@/features/camps/components/email-texts-section/notification-emails-form.schema';

export function useNotificationEmailsForm(organisationId: string, camp: Camp) {
  const update = useUpdateCampMutation(organisationId, camp.id);
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  const form = useAppForm({
    defaultValues: notificationEmailsFormValues(camp),
    validators: { onChange: notificationEmailsFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        formApi.reset(notificationEmailsFormValues(await update.mutateAsync(notificationEmailsChangeOf(value))));
        setStatus('saved');
      } catch {
        setStatus('failed');
      }
    },
  });

  return { form, status };
}
