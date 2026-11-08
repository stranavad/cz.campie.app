// The colour theme: the visitor's choice, kept in this browser, or the system setting until they choose.
// index.html applies the stored choice before the first paint, with the same key and class, so a dark
// page never flashes light; keep the two in step.

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const THEME_COLOURS: Record<Theme, string> = { light: '#fafaf9', dark: '#151311' };

const listeners = new Set<() => void>();

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Storage can be blocked (private mode, strict settings); the system setting still applies.
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function apply(theme: Theme) {
  const root = document.documentElement;

  if (currentTheme() === theme) {
    return;
  }

  // Without this every colour transition on the page would run at once, which stutters on slow phones.
  const freeze = document.createElement('style');
  freeze.textContent = '*,*::before,*::after{transition:none!important}';
  document.head.append(freeze);
  root.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOURS[theme]);
  // Reading a computed style forces the restyle before the transitions come back.
  void window.getComputedStyle(root).colorScheme;
  freeze.remove();
  listeners.forEach((listener) => listener());
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not kept for the next visit, still applied now.
  }

  apply(theme);
}

export function subscribeToTheme(listener: () => void) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

// Follows the system setting while the visitor hasn't chosen a theme; call once at startup.
export function followSystemTheme() {
  window.matchMedia(DARK_QUERY).addEventListener('change', () => {
    if (storedTheme() === null) {
      apply(systemTheme());
    }
  });
}
