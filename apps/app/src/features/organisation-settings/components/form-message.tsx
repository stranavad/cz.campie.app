import type { ReactNode } from 'react';

import { Alert } from '@/components/ui/alert';

interface FormMessageProps {
  tone: 'success' | 'danger';
  children: ReactNode;
}

// The outcome of a save: announced politely when it worked, as an alert when it did not.
export function FormMessage({ tone, children }: FormMessageProps) {
  if (tone === 'danger') {
    return (
      <Alert variant="danger" role="alert">
        {children}
      </Alert>
    );
  }

  return (
    <output className="block">
      <Alert variant="success">{children}</Alert>
    </output>
  );
}
