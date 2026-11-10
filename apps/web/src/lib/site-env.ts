import { site } from '../content/site.ts';

// Which deployment a build is for, from SITE_ENV at build time: `production` (campie.cz), `dev` (the
// preview on dev.campie.cz) or, unset, `local`. Only production is indexable.
export type SiteEnv = 'production' | 'dev' | 'local';

// Cloudflare's Turnstile test site key, which always passes; paired with its test secret in .dev.vars.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export function parseSiteEnv(value: string | undefined): SiteEnv {
  if (value === undefined || value === '') {
    return 'local';
  }
  if (value === 'production' || value === 'dev') {
    return value;
  }
  throw new Error(`SITE_ENV must be "production", "dev" or unset, not "${value}"`);
}

export const siteEnv = parseSiteEnv(process.env.SITE_ENV);

export const isIndexable = siteEnv === 'production';

export const appUrl = siteEnv === 'production' ? site.appUrl.production : site.appUrl.dev;

export const turnstileSiteKey = siteEnv === 'local' ? TURNSTILE_TEST_SITE_KEY : site.turnstileSiteKey;
