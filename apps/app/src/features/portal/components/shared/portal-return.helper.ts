// Where a signed-out guardian was going, kept in this browser so the emailed link, usually opened in a new
// tab, can take them there. It is a path with a Registration id, no personal data.

const STORAGE_KEY = 'portal-return';
const MAX_AGE_MS = 60 * 60 * 1000;

export function rememberPortalReturn(path: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // Storage can be blocked; the guardian then lands on the portal home.
  }
}

// Only a path of the portal: a stored value must never send a fresh login elsewhere.
function portalPath(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('path' in value) || !('at' in value)) {
    return null;
  }

  const { path, at } = value;

  if (typeof path !== 'string' || typeof at !== 'number' || Date.now() - at >= MAX_AGE_MS) {
    return null;
  }

  const isPortal = path.startsWith('/portal/') && !path.startsWith('/portal/prihlaseni');
  const isUnsafe = path.includes('://') || path.includes('\\') || path.split('').some((char) => char <= '\u001f');

  return isPortal && !isUnsafe ? path : null;
}

export function takePortalReturn(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);

    return stored === null ? null : portalPath(JSON.parse(stored));
  } catch {
    return null;
  }
}
