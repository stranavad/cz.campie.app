import type { Inline } from '../content/types.ts';
import { absoluteHref, href } from './href.ts';

// The inline-markdown subset content texts may use: **bold**, `code` and [text](href). Nothing nests.
const TOKEN = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

// For pages: everything escaped, then the three constructs rendered.
export function toHtml(text: Inline): string {
  let html = '';
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [whole, bold, code, linkText, target] = match;
    html += escapeHtml(text.slice(last, match.index));
    if (bold !== undefined) {
      html += `<strong>${escapeHtml(bold)}</strong>`;
    } else if (code !== undefined) {
      html += `<code>${escapeHtml(code)}</code>`;
    } else if (linkText !== undefined && target !== undefined) {
      html += `<a href="${escapeHtml(href(target))}">${escapeHtml(linkText)}</a>`;
    }
    last = match.index + whole.length;
  }
  return html + escapeHtml(text.slice(last));
}

// For meta descriptions and structured data: the markup dropped, the words kept.
export function toPlain(text: Inline): string {
  return text.replace(
    TOKEN,
    (_whole, bold?: string, code?: string, linkText?: string) => bold ?? code ?? linkText ?? '',
  );
}

// For the Markdown twins: already Markdown, only the links made absolute.
export function toMarkdown(text: Inline): string {
  return text.replace(TOKEN, (whole, _bold?: string, _code?: string, linkText?: string, target?: string) =>
    linkText !== undefined && target !== undefined ? `[${linkText}](${absoluteHref(target)})` : whole,
  );
}
