import { useAccountQuery } from '@/core/account';
import { useAcceptInvitationMutation } from '@/features/invitation/api/invitation.queries';
import { HttpError } from '@/lib/api';

export function useJoinExisting(token: string, email: string) {
  const accept = useAcceptInvitationMutation();
  // The invitee may already be signed in as the invited account, in which case the Organisation is one
  // step away; signed in as someone else, they still sign in as the invited account.
  const account = useAccountQuery();
  const isLinkInvalid = accept.error instanceof HttpError && accept.error.code === 'invitation_invalid';

  return {
    isDone: accept.isSuccess,
    isSignedIn: account.data?.email === email,
    isPending: accept.isPending,
    failure: accept.isError ? (isLinkInvalid ? 'invitation_invalid' : 'unexpected') : null,
    join: () => accept.mutate({ token }),
  } as const;
}
