import type { ReactNode } from 'react';

interface TextLinkProps {
  href: string;
  // Filled in by <Trans> from the translated text.
  children?: ReactNode;
}

// A link inside running text, opening a document in a new tab.
export function TextLink({ href, children }: TextLinkProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  );
}
