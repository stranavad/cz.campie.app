import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Reads the `@/*` alias from tsconfig.
    tsconfigPaths: true,
  },
});
