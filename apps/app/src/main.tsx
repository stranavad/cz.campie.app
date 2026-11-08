import '@/lib/i18n';
import '@/index.css';

import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { config } from '@/config';
import { NotFoundPage } from '@/core/application';
import { host, hostRewrite } from '@/core/host';
import { followSystemTheme } from '@/lib/theme';
import { routeTree } from '@/routeTree.gen';

const router = createRouter({ routeTree, rewrite: hostRewrite(host.mode), defaultNotFoundComponent: NotFoundPage });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

document.title = config.productName;
followSystemTheme();

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
