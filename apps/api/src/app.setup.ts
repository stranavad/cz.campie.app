import { StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { HttpErrorFilter } from './core/http/http-error.filter.ts';

export function setupApp<T extends NestExpressApplication>(app: T): T {
  // The frontend's proxy appends the address it was called from to X-Forwarded-For, so the last entry is
  // the browser's; earlier ones came from the client and prove nothing. Without a proxy (in tests) the peer
  // address is the browser's. Audit entries and login limits both rely on it.
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpErrorFilter());
  // Every body, query and param declared with a schema arrives parsed: unknown keys stripped, defaults set.
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  return app;
}
