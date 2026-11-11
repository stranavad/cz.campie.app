import { useBlocker } from '@tanstack/react-router';

/**
 * Asks before the guardian leaves the form with answers not sent: a link away from it, the browser's back
 * past its first step, a reload or a closed tab. Moving between the form's own steps is never stopped.
 * @param isActive whether there is something to lose
 */
export function useLeaveGuard(isActive: boolean) {
  return useBlocker({
    // The steps and the Turnus live in the search of the one route, so leaving is a change of the path.
    shouldBlockFn: ({ current, next }) => current.pathname !== next.pathname,
    enableBeforeUnload: isActive,
    disabled: !isActive,
    withResolver: true,
  });
}
