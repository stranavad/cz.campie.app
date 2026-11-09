import { useSyncExternalStore } from 'react';

// Below Tailwind's `sm`: a phone, where pickers open as a sheet from the bottom instead of a popover.
const NARROW = '(max-width: 39.999rem)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(NARROW);

  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}

export function useNarrowScreen() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(NARROW).matches);
}
