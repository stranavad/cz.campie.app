import { useSyncExternalStore } from 'react';

import { currentTheme, setTheme, subscribeToTheme } from '@/lib/theme/theme';

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme);

  return { theme, setTheme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
