import type { SearchEntry } from '../lib/search.ts';

// The kit's search: the header's magnifier opens a panel with the field, and the phone's drawer holds
// one more. Both are hidden without JavaScript and shown here. The index is fetched on the field's first
// focus, never before, and filtered in the browser: every word typed must appear, accents and case
// aside. Results are links to the guide, its section or the template.

const MAX_RESULTS = 8;

interface Indexed extends SearchEntry {
  normalized: string[];
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

let index: Promise<Indexed[]> | null = null;

// The index's address is the root's data-search attribute.
function loadIndex(path: string): Promise<Indexed[]> {
  index ??= fetch(path)
    .then((response) => response.json() as Promise<SearchEntry[]>)
    .then((entries) => entries.map((entry) => ({ ...entry, normalized: entry.texts.map(normalize) })))
    .catch(() => {
      index = null;
      return [];
    });
  return index;
}

interface Hit {
  entry: Indexed;
  snippet: string | null;
  inTitle: boolean;
}

function find(entries: Indexed[], query: string): Hit[] {
  const words = normalize(query)
    .split(/\s+/)
    .filter((word) => word.length > 1);
  if (words.length === 0) {
    return [];
  }
  const hits: Hit[] = [];
  for (const entry of entries) {
    const all = entry.normalized.join(' ');
    if (!words.every((word) => all.includes(word))) {
      continue;
    }
    const inTitle = words.every((word) => (entry.normalized[0] ?? '').includes(word));
    const at = entry.normalized.findIndex(
      (text, position) => position > 0 && words.some((word) => text.includes(word)),
    );
    hits.push({ entry, snippet: inTitle || at < 0 ? null : (entry.texts[at] ?? null), inTitle });
  }
  return hits.toSorted((a, b) => Number(b.inTitle) - Number(a.inTitle)).slice(0, MAX_RESULTS);
}

function resultItem(hit: Hit): HTMLLIElement {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = hit.entry.href;
  link.className = 'kit-search-hit';
  const title = document.createElement('b');
  title.textContent = hit.entry.title;
  const context = document.createElement('small');
  context.textContent = hit.entry.context;
  link.append(title, context);
  if (hit.snippet !== null) {
    const snippet = document.createElement('span');
    snippet.textContent = hit.snippet;
    link.append(snippet);
  }
  item.append(link);
  return item;
}

for (const root of document.querySelectorAll<HTMLElement>('[data-search]')) {
  const input = root.querySelector<HTMLInputElement>('input');
  const results = root.querySelector<HTMLElement>('[data-search-results]');
  const list = results?.querySelector<HTMLUListElement>('ul');
  const empty = results?.querySelector<HTMLElement>('[data-search-empty]');
  if (!input || !results || !list || !empty) {
    continue;
  }
  const path = root.dataset['search'] ?? '';
  root.hidden = false;

  const close = () => {
    results.hidden = true;
  };

  const show = async () => {
    const query = input.value.trim();
    const hits = find(await loadIndex(path), query);
    if (input.value.trim() !== query) {
      return;
    }
    list.replaceChildren(...hits.map(resultItem));
    empty.hidden = hits.length > 0;
    results.hidden = query.length < 2;
  };

  input.addEventListener('focus', () => void loadIndex(path), { once: true });
  input.addEventListener('input', () => void show());
  root.addEventListener('submit', (event) => {
    event.preventDefault();
    list.querySelector('a')?.click();
  });
  root.addEventListener('keydown', (event) => {
    // In the header's panel Escape closes the panel (handled below); in the drawer it clears the results.
    if (event.key === 'Escape' && root.closest('[data-search-panel]') === null) {
      close();
      input.focus();
    }
    if (event.key === 'ArrowDown' && document.activeElement === input) {
      event.preventDefault();
      list.querySelector('a')?.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !root.contains(event.target)) {
      close();
    }
  });
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      void show();
    }
  });
}

// The header's magnifier and its panel, on the kit's pages: opening focuses the field; Escape, a click
// outside or a followed link closes it and returns the focus to the magnifier.
const opener = document.querySelector<HTMLButtonElement>('[data-search-open]');
const panel = document.querySelector<HTMLElement>('[data-search-panel]');
if (opener && panel) {
  opener.hidden = false;
  let isOpen = false;
  const setOpen = (open: boolean) => {
    isOpen = open;
    panel.hidden = !open;
    opener.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.querySelector('input')?.focus();
    }
  };
  opener.addEventListener('click', () => setOpen(!isOpen));
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      opener.focus();
    }
  });
  panel.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a') !== null) {
      setOpen(false);
    }
  });
  document.addEventListener('click', (event) => {
    if (isOpen && event.target instanceof Node && !panel.contains(event.target) && !opener.contains(event.target)) {
      setOpen(false);
    }
  });
}
