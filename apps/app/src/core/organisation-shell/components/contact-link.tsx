import type { ReactNode } from 'react';

interface ContactLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

// One way to reach the Organisation in the footer, large enough to tap.
export function ContactLink({ href, icon, children }: ContactLinkProps) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 font-semibold break-all text-foreground underline-offset-4 hover:underline"
    >
      {icon}
      {children}
    </a>
  );
}
