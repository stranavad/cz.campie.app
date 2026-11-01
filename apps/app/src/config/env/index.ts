import { envSchema } from '@/config/env/env.schema';

// The dev server runs on *.localhost (Docker Compose and `pnpm dev`), so it defaults to that domain.
const developmentDefaults = import.meta.env.DEV ? { VITE_PLATFORM_DOMAIN: 'localhost' } : {};

export const env = envSchema.parse({ ...developmentDefaults, ...import.meta.env });
