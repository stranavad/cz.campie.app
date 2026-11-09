import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import type { RegistrationStep } from '@/features/registration/components/registration-step.constant';
import { stepNumberOf } from '@/features/registration/components/registration-step.helper';
import { focusFirstProblem, focusStepHeading } from '@/features/registration/components/submission.helper';

/**
 * Which step of the form is open, kept in the address (`?krok=2`) so the browser's back button goes back a
 * step, and how far the guardian got by checked steps.
 * @param slug the Camp's slug
 * @param requestedStep the step the address names, from 1
 */
export function useRegistrationSteps(slug: string, requestedStep: number) {
  const navigate = useNavigate();
  // The furthest step the guardian got to by checked steps: an address naming a later one (a reload, which
  // empties the form) shows this one instead.
  const [reached, setReached] = useState(1);
  // The errors of the steps up to this one are shown: those the guardian asked to leave.
  const [checkedUpTo, setCheckedUpTo] = useState(0);
  const step = Math.min(requestedStep, reached);
  const goTo = (next: number) =>
    navigate({
      to: '/organisation/$campSlug/prihlaska',
      params: { campSlug: slug },
      search: (previous) => ({ ...previous, krok: next === 1 ? undefined : next }),
    });

  return {
    step,
    checkedUpTo,
    isChecked: (name: RegistrationStep) => checkedUpTo >= stepNumberOf(name),
    // Shows the errors of the steps up to this one from now on.
    check: (upTo: number) => setCheckedUpTo(Math.max(checkedUpTo, upTo)),
    // Opens the step after the open one.
    advance: () => {
      setReached(Math.max(reached, step + 1));
      void goTo(step + 1).then(focusStepHeading);
    },
    // Back to an earlier step.
    open: (name: RegistrationStep) => void goTo(stepNumberOf(name)).then(focusStepHeading),
    // Takes the guardian to the first problem, on this step or an earlier one.
    showProblemOn: (target: number) => {
      if (target < step) {
        void goTo(target).then(focusFirstProblem);
      } else {
        focusFirstProblem();
      }
    },
  };
}
