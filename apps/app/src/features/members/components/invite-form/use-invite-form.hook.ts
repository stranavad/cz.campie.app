import { useState } from 'react';

import { useAppForm } from '@/core/form';
import { useInviteMutation } from '@/features/members/api/members.queries';
import { inviteFormOptions, inviteFormSchema } from '@/features/members/components/invite-form/invite-form.schema';
import { HttpError } from '@/lib/api';

export function useInviteForm(organisationId: string) {
  const invite = useInviteMutation(organisationId);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [hasFailed, setFailed] = useState(false);

  const form = useAppForm({
    ...inviteFormOptions,
    onSubmit: async ({ value, formApi }) => {
      setSentTo(null);
      setFailed(false);

      try {
        const invitation = await invite.mutateAsync(inviteFormSchema.parse(value));

        setSentTo(invitation.email);
        formApi.reset();
      } catch (error) {
        if (error instanceof HttpError && error.code === 'already_member') {
          formApi.setFieldMeta('email', (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: 'already_member' },
          }));
        } else {
          setFailed(true);
        }
      }
    },
  });

  return { form, sentTo, hasFailed };
}
