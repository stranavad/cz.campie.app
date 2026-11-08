import type { ReactNode } from 'react';

import { Alert } from '@/components/ui/alert';

interface StatusMessageProps {
  // `success` confirms a change; `danger` says it failed and is announced at once.
  tone: 'success' | 'danger';
  children: ReactNode;
}

// The line under a portal form telling how its last action ended.
export function StatusMessage({ tone, children }: StatusMessageProps) {
  return tone === 'danger' ? (
    <Alert variant="danger" role="alert">
      {children}
    </Alert>
  ) : (
    <Alert variant="success">
      <output>{children}</output>
    </Alert>
  );
}
