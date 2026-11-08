import { splitPlaceholders } from '@/features/legal/components/legal-document/legal-text.helper';

interface LegalTextProps {
  // Already translated.
  text: string;
}

// A paragraph's text with the operator's unfilled placeholders highlighted, so a draft shows its gaps.
export function LegalText({ text }: LegalTextProps) {
  return splitPlaceholders(text).map((part, index) =>
    part.placeholder ? (
      // oxlint-disable-next-line react/no-array-index-key -- the parts of one fixed text never reorder
      <mark key={index} className="rounded bg-amber-100 px-1 text-amber-950">
        {part.text}
      </mark>
    ) : (
      // oxlint-disable-next-line react/no-array-index-key -- the parts of one fixed text never reorder
      <span key={index}>{part.text}</span>
    ),
  );
}
