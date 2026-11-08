import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';

import type { Env } from './core/config/env.schema.ts';
import { HttpErrorFilter } from './core/http/http-error.filter.ts';
import { requireProxySecret } from './core/http/proxy-secret.ts';

export function setupApp<T extends NestExpressApplication>(app: T): T {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const proxySecret = config.get('PROXY_SECRET', { infer: true });

  // Registered before Nest adds its body parsers and routes at init, so a request past the proxy is
  // refused before any of them runs.
  if (proxySecret !== undefined) {
    app.use(requireProxySecret(proxySecret));
  }

  // Each of the TRUST_PROXY_HOPS proxies in front of the API appends the address it was called from to
  // X-Forwarded-For, so the entry that many places from the end is the browser's; earlier ones came from
  // the client and prove nothing. Tests send the header as the one proxy would. Audit entries, login limits
  // and request limits rely on it.
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpErrorFilter());
  // Every body, query and param declared with a schema arrives parsed: unknown keys stripped, defaults set.
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  return app;
}
