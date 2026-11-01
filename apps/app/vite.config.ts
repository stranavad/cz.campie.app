import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    // Must run before the React plugin, so it sees the code-split route files.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    // Reads the `@/*` alias from tsconfig.
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      // The Host header is kept and X-Forwarded-Host is added, as Vercel's rewrite does, so the API
      // sees which Organisation's subdomain was called (ADR-0001).
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000', xfwd: true },
    },
  },
});
