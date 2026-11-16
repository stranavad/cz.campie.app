import { linkOptions } from '@tanstack/react-router';

import { useSetupProgressQuery } from '@/features/admin-home/api/setup-progress.queries';

// The steps to the first Registration, each with whether it is done and where it is done. Nothing until
// the progress loads, and nothing when it fails: the card is a guide, the page works without it.
export function useSetupSteps(organisationId: string, isOwner: boolean) {
  const { data } = useSetupProgressQuery(organisationId);

  if (data === undefined) {
    return null;
  }

  const tabor = data.campId ?? undefined;
  const steps = [
    {
      key: 'bankAccount',
      done: data.bankAccount,
      // The Organisation's settings are the Owners'; other admins read who sets it.
      link: isOwner ? linkOptions({ to: '/platform/nastaveni' }) : null,
    },
    {
      key: 'turnus',
      done: data.turnus,
      link: linkOptions({ to: '/platform/tabory', search: { tabor, sekce: 'turnusy' } }),
    },
    {
      key: 'registrationForm',
      done: data.registrationForm,
      link: linkOptions({ to: '/platform/tabory', search: { tabor, sekce: 'formular' } }),
    },
  ] as const;
  const done = steps.filter((step) => step.done).length;

  return { steps, done, isComplete: done === steps.length };
}
