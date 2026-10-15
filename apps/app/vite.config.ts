import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Reads the `@/*` alias from tsconfig.
    tsconfigPaths: true,
  },
  server: {
    // The original Host header is kept, so the API sees which Organisation's subdomain was called.
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3000' },
  },
});
