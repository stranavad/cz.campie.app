import type { INestApplication } from '@nestjs/common';

import { HttpErrorFilter } from './core/http/http-error.filter.ts';

export function setupApp<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpErrorFilter());

  return app;
}
