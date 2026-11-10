// The Worker's bindings (wrangler.jsonc): vars, secrets (`wrangler secret put`) and the rate limiter.
export interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
  CONTACT_LIMITER: RateLimiter;
}

// Cloudflare's Rate Limiting binding, the one method used.
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}
