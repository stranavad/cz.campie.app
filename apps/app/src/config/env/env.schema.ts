import { z } from 'zod';

// A bare hostname: lowercase labels joined by dots, no scheme, port or path.
const hostname = z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/);

// Defaults are the production platform; self-hosters override them at build time.
export const envSchema = z.object({
  VITE_PRODUCT_NAME: z.string().min(1).default('Campie'),
  VITE_PLATFORM_DOMAIN: hostname.default('campie.cz'),
});

export type Env = z.infer<typeof envSchema>;
